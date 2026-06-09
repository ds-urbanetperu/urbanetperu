export class ReportAdapter {
    static fromRequest(reqBody, reqUser) {
        return {
            userId: reqUser.userId,
            userName: reqBody.userName,
            userEmail: reqBody.userEmail,
            title: reqBody.title,
            description: reqBody.description,
            location: reqBody.location,
            latitude: reqBody.latitude,
            longitude: reqBody.longitude,
            category: reqBody.category,
            priority: reqBody.priority,
            images: reqBody.images
        };
    }

    static toResponse(reportDoc) {
        return {
            id: reportDoc._id,
            userId: reportDoc.userId,
            userName: reportDoc.userName,
            title: reportDoc.title,
            description: reportDoc.description,
            location: reportDoc.location,
            latitude: reportDoc.latitude,
            longitude: reportDoc.longitude,
            category: reportDoc.category,
            status: reportDoc.status,
            priority: reportDoc.priority,
            images: reportDoc.images,
            createdAt: reportDoc.createdAt,
            updatedAt: reportDoc.updatedAt
        };
    }

    static toResponseList(reportDocs) {
        return reportDocs.map((doc) => ReportAdapter.toResponse(doc));
    }
}