import { Client } from '@gradio/client';
import Report from '../../models/Report.js';
import { ReportAdapter } from '../adapters/ReportAdapter.js';
import { ReportBuilder } from '../builders/ReportBuilder.js';

export class ReportService {
    static async createReport(reqBody, reqUser) {
        const data = ReportAdapter.fromRequest(reqBody, reqUser);

        let severity = 'No determinada';
        let confidence = 0.0;

        if (data.category === 'bache' && data.images && data.images.length > 0) {
            try {
                const imageBase64 = data.images[0];
                const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches) {
                    const mimeType = matches[1];
                    const base64Data = matches[2];
                    const buffer = Buffer.from(base64Data, 'base64');
                    
                    // Use native global Blob which is fully compatible with @gradio/client
                    const blob = new Blob([buffer], { type: mimeType });

                    // Connect to Hugging Face space
                    const client = await Client.connect("https://luisserva02-urbanetperu.hf.space");
                    
                    // Execute the prediction on the api_predict endpoint
                    const result = await client.predict("/api_predict", [blob]);
                    
                    if (result && result.data && result.data[0]) {
                        const apiResponse = result.data[0];
                        confidence = apiResponse.confidence || 0.0;
                        
                        if (apiResponse.severity === "Muy grave") {
                            severity = "Crítico";
                        } else if (apiResponse.severity === "Moderado") {
                            severity = "Moderado";
                        } else if (apiResponse.severity === "Leve") {
                            severity = "Leve";
                        }
                    }
                }
            } catch (error) {
                console.error("Error al evaluar la gravedad del bache con Hugging Face:", error);
            }
        }

        const priority = severity === 'Crítico' ? 'alta' : (data.priority || 'media');

        const reportData = new ReportBuilder()
            .setOwner(data.userId, data.userName, data.userEmail)
            .setContent(data.title, data.description)
            .setLocation(data.location, data.latitude, data.longitude)
            .setCategory(data.category)
            .setPriority(priority)
            .setImages(data.images)
            .setSeverity(severity)
            .setConfidence(confidence)
            .build();

        const report = await Report.create(reportData);
        return ReportAdapter.toResponse(report);
    }

    static async getReportsByUser(userId) {
        const reports = await Report.find({ userId }).sort({ createdAt: -1 });
        return ReportAdapter.toResponseList(reports);
    }

    static async getAllReports({ status, category, priority } = {}) {
        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (priority) filter.priority = priority;

        const reports = await Report.find(filter).sort({ createdAt: -1 });
        return ReportAdapter.toResponseList(reports);
    }

    static async getReportById(reportId) {
        const report = await Report.findById(reportId);
        if (!report) return null;
        return ReportAdapter.toResponse(report);
    }

    static async updateReport(reportId, { status, priority }) {
        const report = await Report.findByIdAndUpdate(
            reportId,
            { status, priority },
            { new: true }
        );
        if (!report) return null;
        return ReportAdapter.toResponse(report);
    }

    static async deleteReport(reportId) {
        const report = await Report.findByIdAndDelete(reportId);
        return Boolean(report);
    }
}