const VALID_CATEGORIES = ['bache', 'luminaria', 'basura', 'otro'];
const VALID_PRIORITIES = ['baja', 'media', 'alta'];

export class ReportBuilder {
    constructor() {
        this.report = {
            category: 'bache',
            priority: 'media',
            images: []
        };
    }

    setOwner(userId, userName, userEmail) {
        this.report.userId = userId;
        this.report.userName = userName;
        this.report.userEmail = userEmail;
        return this;
    }

    setContent(title, description) {
        this.report.title = title;
        this.report.description = description;
        return this;
    }

    setLocation(location, latitude, longitude) {
        this.report.location = location;
        if (latitude !== undefined) this.report.latitude = latitude;
        if (longitude !== undefined) this.report.longitude = longitude;
        return this;
    }

    setCategory(category) {
        if (category && VALID_CATEGORIES.includes(category)) {
            this.report.category = category;
        }
        return this;
    }

    setPriority(priority) {
        if (priority && VALID_PRIORITIES.includes(priority)) {
            this.report.priority = priority;
        }
        return this;
    }

    setImages(images) {
        if (Array.isArray(images)) {
            this.report.images = images;
        }
        return this;
    }

    setSeverity(severity) {
        this.report.severity = severity;
        return this;
    }

    setConfidence(confidence) {
        this.report.confidence = confidence;
        return this;
    }

    build() {
        if (!this.report.userId) throw new Error('El ID del usuario es obligatorio.');
        if (!this.report.userName) throw new Error('El nombre del usuario es obligatorio.');
        if (!this.report.userEmail) throw new Error('El correo del usuario es obligatorio.');
        if (!this.report.title?.trim()) throw new Error('El título del reporte es obligatorio.');
        if (!this.report.description?.trim()) throw new Error('La descripción del reporte es obligatoria.');
        if (!this.report.location?.trim()) throw new Error('La ubicación del reporte es obligatoria.');

        return { ...this.report };
    }
}