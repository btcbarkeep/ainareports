"use client";

export default function BuildingPrintButton({ building, totalUnits, totalEvents, totalDocuments, totalContractors, propertyManagers, events, documents, units, aoao }) {
  const generatePDF = async () => {
    try {
      // Dynamic import for jsPDF - it uses default export in v3
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.default;
      if (!jsPDF) {
        throw new Error("jsPDF default export not found");
      }
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Helper function to add a new page if needed
      const checkPageBreak = (requiredSpace) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
          return true;
        }
        return false;
      };

      // Title
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text(building.name || "Building Report", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Building Address
      if (building.address || building.city || building.state) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        const addressParts = [
          building.address,
          building.city,
          building.state,
          building.zip
        ].filter(Boolean);
        doc.text(addressParts.join(", "), pageWidth / 2, yPosition, { align: "center" });
        yPosition += 10;
      }

      // Building Details
      yPosition += 5;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Building Details", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      
      const details = [];
      if (totalUnits) details.push(`Total Units: ${totalUnits}`);
      if (building.floors) details.push(`Floors: ${building.floors}`);
      if (building.zoning) details.push(`Zoning: ${building.zoning}`);
      if (building.bedrooms) details.push(`Bedrooms: ${building.bedrooms}`);
      if (building.bathrooms) details.push(`Bathrooms: ${building.bathrooms}`);
      if (building.square_feet) details.push(`Square Feet: ${building.square_feet.toLocaleString()}`);

      details.forEach((detail, index) => {
        checkPageBreak(8);
        doc.text(detail, margin + 5, yPosition);
        yPosition += 8;
      });

      // Statistics
      yPosition += 5;
      checkPageBreak(20);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Statistics", margin, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      
      if (totalEvents !== null) {
        checkPageBreak(8);
        doc.text(`Total Events: ${totalEvents}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (totalDocuments !== null) {
        checkPageBreak(8);
        doc.text(`Total Documents: ${totalDocuments}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (totalContractors !== null) {
        checkPageBreak(8);
        doc.text(`Total Contractors: ${totalContractors}`, margin + 5, yPosition);
        yPosition += 8;
      }
      if (propertyManagers && propertyManagers.length > 0) {
        checkPageBreak(8);
        doc.text(`Property Management Companies: ${propertyManagers.length}`, margin + 5, yPosition);
        yPosition += 8;
      }

      // AOAO Organization
      if (aoao) {
        yPosition += 5;
        checkPageBreak(20);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("AOAO Organization", margin, yPosition);
        yPosition += 10;

        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        if (aoao.company_name || aoao.name) {
          checkPageBreak(8);
          doc.text(`Name: ${aoao.company_name || aoao.name}`, margin + 5, yPosition);
          yPosition += 8;
        }
        if (aoao.phone) {
          checkPageBreak(8);
          doc.text(`Phone: ${aoao.phone}`, margin + 5, yPosition);
          yPosition += 8;
        }
        if (aoao.email) {
          checkPageBreak(8);
          doc.text(`Email: ${aoao.email}`, margin + 5, yPosition);
          yPosition += 8;
        }
      }

      // Property Management
      if (propertyManagers && propertyManagers.length > 0) {
        yPosition += 5;
        checkPageBreak(25);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Property Management Companies", margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        propertyManagers.slice(0, 10).forEach((pm, index) => {
          checkPageBreak(20);
          doc.setFont("helvetica", "bold");
          doc.text(`${index + 1}. ${pm.company_name || pm.name || "Property Manager"}`, margin + 5, yPosition);
          yPosition += 7;
          
          doc.setFont("helvetica", "normal");
          if (pm.license_number && pm.license_number !== "string") {
            doc.text(`   License: ${pm.license_number}`, margin + 5, yPosition);
            yPosition += 6;
          }
          if (pm.phone) {
            doc.text(`   Phone: ${pm.phone}`, margin + 5, yPosition);
            yPosition += 6;
          }
          yPosition += 3;
        });
      }

      // Recent Events
      if (events && events.length > 0) {
        yPosition += 5;
        checkPageBreak(25);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Recent Events", margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        events.slice(0, 20).forEach((event, index) => {
          checkPageBreak(20);
          const eventDate = event.occurred_at ? new Date(event.occurred_at).toLocaleDateString() : "—";
          doc.setFont("helvetica", "bold");
          doc.text(`${index + 1}. ${event.title || "Event"}`, margin + 5, yPosition);
          yPosition += 7;
          
          doc.setFont("helvetica", "normal");
          doc.text(`   Date: ${eventDate}`, margin + 5, yPosition);
          yPosition += 6;
          if (event.event_type) {
            doc.text(`   Type: ${event.event_type}`, margin + 5, yPosition);
            yPosition += 6;
          }
          if (event.severity) {
            doc.text(`   Severity: ${event.severity}`, margin + 5, yPosition);
            yPosition += 6;
          }
          yPosition += 3;
        });
      }

      // Recent Documents
      if (documents && documents.length > 0) {
        yPosition += 5;
        checkPageBreak(25);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Recent Documents", margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        documents.slice(0, 15).forEach((doc, index) => {
          checkPageBreak(15);
          const docDate = doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—";
          doc.setFont("helvetica", "bold");
          doc.text(`${index + 1}. ${doc.title || doc.filename || "Document"}`, margin + 5, yPosition);
          yPosition += 7;
          
          doc.setFont("helvetica", "normal");
          if (doc.category) {
            doc.text(`   Category: ${doc.category}`, margin + 5, yPosition);
            yPosition += 6;
          }
          doc.text(`   Uploaded: ${docDate}`, margin + 5, yPosition);
          yPosition += 6;
          yPosition += 3;
        });
      }

      // Units Summary
      if (units && units.length > 0) {
        yPosition += 5;
        checkPageBreak(20);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Units", margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        // Create a table-like structure
        units.slice(0, 30).forEach((unit, index) => {
          checkPageBreak(10);
          const unitInfo = [
            unit.unit_number || "—",
            unit.floor ? `Floor ${unit.floor}` : "—",
            unit.owner_name || "—"
          ].filter(item => item !== "—").join(" • ");
          
          doc.text(`${index + 1}. ${unitInfo}`, margin + 5, yPosition);
          yPosition += 7;
        });
      }

      // Footer
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          `Generated by AinaReports on ${new Date().toLocaleDateString()}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
        doc.text(
          `Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: "center" }
        );
      }

      // Save the PDF
      doc.save(`${building.name || "Building"}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(`Error generating PDF: ${error.message || error.toString()}. Please check the console for details.`);
    }
  };

  return (
    <div className="border rounded-md p-4 bg-gray-50 text-sm mt-8">
      <h3 className="font-semibold mb-1 text-center">Building Report</h3>
      <p className="text-gray-700 text-xs mb-4 text-center">
        Download a comprehensive report with building data, events, documents, contractor activity, and unit details for {building.name}.
      </p>
      <div className="space-y-2">
        <button
          onClick={generatePDF}
          className="block w-full text-center border border-gray-800 rounded-md py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 transition-colors"
          aria-label="Print Free Basic Report"
        >
          Free Basic Report
        </button>
        <button
          disabled
          className="block w-full text-center border border-gray-400 rounded-md py-2 text-sm font-medium text-gray-500 cursor-not-allowed"
          title="Full Premium Report coming soon"
          aria-label="Full Premium Report"
        >
          Full Premium Report - Coming Soon
        </button>
      </div>
    </div>
  );
}

