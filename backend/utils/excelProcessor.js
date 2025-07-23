const XLSX = require("xlsx");
const path = require("path");

// Email validation regex
const emailRegex =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

// Process Excel file and extract emails
const processExcelFile = (filePath) => {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;

    let allEmails = [];

    // Process each sheet
    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Process each row
      for (let rowIndex = 0; rowIndex < jsonData.length; rowIndex++) {
        const row = jsonData[rowIndex];

        // Process each cell in the row
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          const cellValue = row[colIndex];

          if (cellValue && typeof cellValue === "string") {
            // Check if the cell contains an email
            if (emailRegex.test(cellValue.trim())) {
              const email = cellValue.trim().toLowerCase();

              // Avoid duplicates
              if (!allEmails.find((item) => item.email === email)) {
                // Try to find name in adjacent cells
                let name = "";

                // Check previous cell for name (common pattern: Name | Email)
                if (colIndex > 0 && row[colIndex - 1]) {
                  const prevCell = row[colIndex - 1].toString().trim();
                  if (prevCell && !emailRegex.test(prevCell)) {
                    name = prevCell;
                  }
                }

                // Check next cell for name (common pattern: Email | Name)
                if (!name && colIndex < row.length - 1 && row[colIndex + 1]) {
                  const nextCell = row[colIndex + 1].toString().trim();
                  if (nextCell && !emailRegex.test(nextCell)) {
                    name = nextCell;
                  }
                }

                // Check same row, first column for name (common pattern: Name in first column)
                if (!name && row[0] && colIndex > 0) {
                  const firstCell = row[0].toString().trim();
                  if (firstCell && !emailRegex.test(firstCell)) {
                    name = firstCell;
                  }
                }

                allEmails.push({
                  email: email,
                  name: name || "",
                  status: "pending",
                });
              }
            }
          }
        }
      }
    }

    return {
      success: true,
      emails: allEmails,
      totalEmails: allEmails.length,
      validEmails: allEmails.filter((item) => emailRegex.test(item.email)).length,
    };
  } catch (error) {
    console.error("Error processing Excel file:", error);
    return {
      success: false,
      error: error.message,
      emails: [],
      totalEmails: 0,
      validEmails: 0,
    };
  }
};

// Validate email format
const isValidEmail = (email) => {
  return emailRegex.test(email);
};

// Extract emails from text (in case of CSV or text files)
const extractEmailsFromText = (text) => {
  const matches = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
  if (!matches) return [];

  return matches.map((email) => ({
    email: email.toLowerCase(),
    name: "",
    status: "pending",
  }));
};

module.exports = {
  processExcelFile,
  isValidEmail,
  extractEmailsFromText,
};
