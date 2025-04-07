const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const { logger } = require('../utils/logger');
const Scan = require('../models/Scan');
const Patient = require('../models/Patient');

class ReportService {
    constructor() {
        this.templatesDir = path.join(__dirname, '../templates');
    }

    async generateReport(scanId, patientId) {
        try {
            const scan = await Scan.findById(scanId)
                .populate('doctorId', 'name email');

            if (!scan) {
                throw new Error('Scan not found');
            }

            // Create a simple patient object from scan data
            const patient = {
                name: scan.patientName,
                patientId: scan.patientId,
                dateOfBirth: new Date(), // Default to current date
                gender: 'unknown',
                age: 0,
                contact: {}
            };

            const doc = new PDFDocument();
            const reportPath = path.join(__dirname, `../reports/report-${scanId}.pdf`);
            doc.pipe(fs.createWriteStream(reportPath));

            // Add header
            this.addHeader(doc, patient, scan);

            // Add patient information
            this.addPatientInfo(doc, patient);

            // Add scan information
            this.addScanInfo(doc, scan);

            // Add results
            this.addResults(doc, scan);

            // Add annotations if any
            if (scan.annotations && scan.annotations.length > 0) {
                this.addAnnotations(doc, scan);
            }

            // Add medical history
            this.addMedicalHistory(doc, patient);

            // Add footer
            this.addFooter(doc);

            doc.end();

            // Update scan with report URL
            scan.reportUrl = `/reports/report-${scanId}.pdf`;
            await scan.save();

            logger.info(`Report generated for scan ${scanId}`);
            return reportPath;
        } catch (error) {
            logger.error(`Error generating report for scan ${scanId}:`, error);
            throw error;
        }
    }

    addHeader(doc, patient, scan) {
        doc.fontSize(20)
           .text('Brain Tumor Classification Report', { align: 'center' })
           .moveDown();

        doc.fontSize(12)
           .text(`Generated on: ${new Date().toLocaleDateString()}`)
           .text(`Report ID: ${scan._id}`)
           .moveDown();
    }

    addPatientInfo(doc, patient) {
        doc.fontSize(16)
           .text('Patient Information')
           .moveDown();

        doc.fontSize(12)
           .text(`Name: ${patient.name}`)
           .text(`ID: ${patient.patientId}`)
           .text(`Date of Birth: ${patient.dateOfBirth ? patient.dateOfBirth.toLocaleDateString() : 'N/A'}`)
           .text(`Gender: ${patient.gender || 'N/A'}`)
           .text(`Age: ${patient.age || 'N/A'}`)
           .moveDown();

        if (patient.contact) {
            doc.text('Contact Information:')
               .text(`Email: ${patient.contact.email || 'N/A'}`)
               .text(`Phone: ${patient.contact.phone || 'N/A'}`)
               .text(`Address: ${patient.contact.address || 'N/A'}`)
               .moveDown();
        }
    }

    addScanInfo(doc, scan) {
        doc.fontSize(16)
           .text('Scan Information')
           .moveDown();

        doc.fontSize(12)
           .text(`Scan Date: ${scan.scanDate ? new Date(scan.scanDate).toLocaleDateString() : 'N/A'}`)
           .text(`Status: ${scan.status || 'N/A'}`)
           .text(`Doctor: ${scan.doctorId && scan.doctorId.name ? scan.doctorId.name : 'N/A'}`)
           .moveDown();
    }

    addResults(doc, scan) {
        doc.fontSize(16)
           .text('Analysis Results')
           .moveDown();

        if (scan.result) {
            doc.fontSize(12)
               .text(`Tumor Present: ${scan.result.hasTumor ? 'Yes' : 'No'}`)
               .text(`Confidence: ${scan.result.confidence ? (scan.result.confidence * 100).toFixed(2) + '%' : 'N/A'}`)
               .text(`Tumor Type: ${scan.result.tumorType || 'N/A'}`)
               .text(`Location: ${scan.result.tumorLocation || 'N/A'}`)
               .text(`Size: ${scan.result.tumorSize || 'N/A'}`)
               .moveDown();

            if (scan.result.additionalNotes) {
                doc.text('Additional Notes:')
                   .text(scan.result.additionalNotes)
                   .moveDown();
            }
        } else {
            doc.fontSize(12)
               .text('No analysis results available')
               .moveDown();
        }
    }

    addAnnotations(doc, scan) {
        if (scan.annotations && scan.annotations.length > 0) {
            doc.fontSize(16)
               .text('Image Annotations')
               .moveDown();

            scan.annotations.forEach((annotation, index) => {
                doc.fontSize(12)
                   .text(`Annotation ${index + 1}:`)
                   .text(`Location: (${annotation.x || 0}, ${annotation.y || 0})`)
                   .text(`Note: ${annotation.text || 'N/A'}`)
                   .text(`Added on: ${annotation.createdAt ? new Date(annotation.createdAt).toLocaleDateString() : 'N/A'}`)
                   .moveDown();
            });
        }
    }

    addMedicalHistory(doc, patient) {
        // Skip medical history section for now since we're using a simplified patient object
        // In a real application, you would populate this from the patient's medical history
    }

    addFooter(doc) {
        doc.fontSize(10)
           .text('This report was generated automatically by the Brain Tumor Classification System.')
           .text('For any questions or concerns, please contact your healthcare provider.')
           .text('This report is confidential and intended for medical professionals only.');
    }
}

module.exports = new ReportService();