import Report from '../../models/Report.js';
import { ReportAdapter } from '../adapters/ReportAdapter.js';
import { ReportBuilder } from '../builders/ReportBuilder.js';

export class ReportService {
    static async createReport(reqBody, reqUser) {
        const data = ReportAdapter.fromRequest(reqBody, reqUser);

        const reportData = new ReportBuilder()
        .setOwner(data.userId, data.userName, data.userEmail)
        .setContent(data.title, data.description)
        .setLocation(data.location, data.latitude, data.longitude)
        .setCategory(data.category)
        .setPriority(data.priority)
        .setImages(data.images)
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