// Import dependencies
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { processMaterialMasterCSV, processTimeMasterCSV, processMaterialConsumptionCSV, processMaterialForecastingCSV, processProposedSapCSV, processGrnCSV, processStockCSV, processPpoCSV } from "./services/uploadData.js"
import cors from 'cors'
import ExcelJS from 'exceljs';
import fs from "fs"
import https from "https"
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';


// Initialize Express and Prisma
const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(cors());

// Health check route
app.get('/', (req, res) => {
    res.send('API is running...');
});
// Get the filename and directory from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, 'uploads');

// Ensure the 'uploads' folder exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir); // Save files to the 'uploads' folder
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Keep the original filename
    }
});


// Create a multer instance with storage configuration
const upload = multer({ storage });

// API to handle multiple specific file uploads
app.post("/upload", upload.array("files", 8), (req, res) => { // Max 8 files
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
    }

    // Validate the filenames to ensure they match expected CSV names
    const expectedFiles = [
        "time_master.csv",
        "material_consumption.csv",
        "material_master.csv",
        "forecasting.csv",
        "sap.csv",
        "stock.csv",
        "grn.csv",
        "ppo.csv"
    ];

    const uploadedFileNames = req.files.map(file => file.originalname);
    const missingFiles = expectedFiles.filter(file => !uploadedFileNames.includes(file));

    if (missingFiles.length > 0) {
        return res.status(400).json({
            error: `Missing required files: ${missingFiles.join(", ")}`
        });
    }

    res.json({
        message: "Files uploaded successfully",
        filenames: req.files.map(file => file.originalname)
    });
});

app.get('/upload-data', async (req, res) => {
    try {
        await processMaterialMasterCSV();
        await processTimeMasterCSV();
        await processMaterialConsumptionCSV();
        await processMaterialForecastingCSV();
        await processProposedSapCSV();
        await processGrnCSV();
        await processStockCSV();
        await processPpoCSV();
        res.send('CSV file processed successfully');
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});


app.get('/consumption-table', async (req, res) => {
    try {
        const { page = 1, itemsPerPage = 10 } = req.query;

        const pageNumber = parseInt(page);
        const perPage = parseInt(itemsPerPage);

        // Validate pagination parameters
        if (isNaN(pageNumber) || isNaN(perPage) || pageNumber < 1 || perPage < 1) {
            return res.status(400).send({ message: "Invalid pagination parameters" });
        }

        const offset = (pageNumber - 1) * perPage;

        // Fetch paginated data
        const result = await prisma.$queryRaw`
            SELECT * FROM "ComputedMaterialConsumption"
            LIMIT ${perPage} OFFSET ${offset};
        `;

        // Fetch total count for pagination
        const totalCountResult = await prisma.$queryRaw`
            SELECT COUNT(*)::bigint AS count FROM "ComputedMaterialConsumption";
        `;

        const totalCount = Number(totalCountResult[0]?.count || 0); // Convert BigInt count to Number

        // Convert BigInt values to strings for JSON serialization
        const formattedResult = result.map(row =>
            Object.fromEntries(
                Object.entries(row).map(([key, value]) => [
                    key, typeof value === 'bigint' ? value.toString() : value
                ])
            )
        );

        // Send paginated response
        res.send({
            totalItems: totalCount,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalCount / perPage),
            data: formattedResult
        });

    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});


app.get('/forecast-table', async (req, res) => {
    try {
        // Get pagination parameters from query string
        const { page = 1, itemsPerPage = 10 } = req.query;
        const pageNumber = parseInt(page);
        const perPage = parseInt(itemsPerPage);
        const offset = (pageNumber - 1) * perPage;

        // Validate pagination inputs
        if (isNaN(pageNumber) || isNaN(perPage) || pageNumber < 1 || perPage < 1) {
            return res.status(400).send({ message: "Invalid pagination parameters" });
        }

        // Fetch paginated data from the view
        const result = await prisma.$queryRaw`
            SELECT * FROM "material_avgconsumption_forecast_sap"
            LIMIT ${perPage} OFFSET ${offset};
        `;

        // Fetch total count for pagination
        const totalCountResult = await prisma.$queryRaw`
            SELECT COUNT(*)::bigint AS count FROM "material_avgconsumption_forecast_sap";
        `;

        const totalCount = Number(totalCountResult[0]?.count || 0); // Convert BigInt count to Number

        // Convert BigInt values to strings for JSON serialization
        const formattedResult = result.map(row =>
            Object.fromEntries(
                Object.entries(row).map(([key, value]) => [
                    key, typeof value === 'bigint' ? value.toString() : value
                ])
            )
        );

        const data = {
            totalItems: totalCount,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalCount / perPage),
            data: formattedResult
        }

        // Send paginated response
        res.send(data);

    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});


// app.get('/material-summary', async (req, res) => {
//     try {
//         const { page = 1, itemsPerPage = 10 } = req.query;

//         const pageNumber = parseInt(page);
//         const perPage = parseInt(itemsPerPage);
//         const offset = (pageNumber - 1) * perPage;

//         if (isNaN(pageNumber) || isNaN(perPage) || pageNumber < 1 || perPage < 1) {
//             return res.status(400).send({ message: "Invalid pagination parameters" });
//         }

//         // Fetch ComputedMaterialConsumption (Consumption Data)
//         const consumptionResult = await prisma.$queryRaw`
//             SELECT "materialId", "totalConsumption", "details" 
//             FROM "ComputedMaterialConsumption"
//             LIMIT ${perPage} OFFSET ${offset};
//         `;

//         // Fetch material_grn_stock_view (GRN + Stock)
//         const grnStockResult = await prisma.$queryRaw`
//             SELECT "materialId", "grnQuantity", "stockQuantity" 
//             FROM "material_grn_stock_view";
//         `;

//         // Fetch material_ppo (Pending Quantity + Supplier)
//         const ppoResult = await prisma.$queryRaw`
//             SELECT "materialId", "pendingQuantity", "supplier" 
//             FROM "material_ppo";
//         `;

//         console.log('Consumption Result:');
//         console.log(consumptionResult);

//         // Convert BigInt to String for ALL results
//         const formatBigInt = (row) => {
//             return Object.fromEntries(
//                 Object.entries(row).map(([key, value]) => [
//                     key, typeof value === 'bigint' ? value.toString().trim() : value
//                 ])
//             );
//         };

//         const formattedConsumption = consumptionResult.map(formatBigInt);
//         const formattedGrnStock = grnStockResult.map(formatBigInt);
//         const formattedPpo = ppoResult.map(formatBigInt);

//         // ✅ Convert materialId to STRING and TRIM in lookup maps
//         const grnStockMap = new Map(
//             formattedGrnStock.map(item => [item.materialId.toString().trim(), item])
//         );
//         const ppoMap = new Map(
//             formattedPpo.map(item => [item.materialId.toString().trim(), item])
//         );

//         // ✅ Merge the Data with Correct Lookups
//         const finalResult = formattedConsumption.map(item => {
//             const materialId = item.materialId.toString().trim(); // Ensure string

//             return {
//                 materialId,
//                 description: item.details?.[0]?.description?.trim() || "N/A",
//                 consumption: Array.isArray(item.details) ? item.details.map(d => ({
//                     monthYear: d.monthYear,
//                     consumption: d.quantity
//                 })) : [],
//                 grnPlusStock: grnStockMap.get(materialId)?.grnPlusStock || 0, // Lookup correctly
//                 pendingQuantity: ppoMap.get(materialId)?.pendingQuantity || 0, // Lookup correctly
//                 supplier: ppoMap.get(materialId)?.supplier?.trim() || "N/A" // Trim supplier
//             };
//         });

//         // Fetch total count for pagination
//         const totalCountResult = await prisma.$queryRaw`
//             SELECT COUNT(*)::bigint AS count FROM "ComputedMaterialConsumption";
//         `;
//         const totalCount = Number(totalCountResult[0]?.count || 0);

//         // ✅ Send Final Response with Pagination
//         res.send({
//             totalItems: totalCount,
//             currentPage: pageNumber,
//             totalPages: Math.ceil(totalCount / perPage),
//             data: finalResult
//         });

//     } catch (error) {
//         console.error("Error fetching material summary:", error);
//         res.status(500).send({ message: error.message });
//     }
// });


app.get('/material-summary', async (req, res) => {
    try {
        const { page = 1, itemsPerPage = 10 } = req.query;

        const pageNumber = parseInt(page);
        const perPage = parseInt(itemsPerPage);
        const offset = (pageNumber - 1) * perPage;

        if (isNaN(pageNumber) || isNaN(perPage) || pageNumber < 1 || perPage < 1) {
            return res.status(400).send({ message: "Invalid pagination parameters" });
        }

        // Fetch ComputedMaterialConsumption (Consumption Data)
        const consumptionResult = await prisma.$queryRaw`
            SELECT "materialId", "totalConsumption", "details" 
            FROM "ComputedMaterialConsumption"
            LIMIT ${perPage} OFFSET ${offset};
        `;

        // Fetch material_grn_stock_view (GRN + Stock)
        const grnStockResult = await prisma.$queryRaw`
            SELECT "materialId", "grnQuantity", "stockQuantity" 
            FROM "material_grn_stock_view";
        `;

        // Fetch material_ppo (Pending Quantity + Supplier)
        const ppoResult = await prisma.$queryRaw`
            SELECT "materialId", "pendingQuantity", "supplier" 
            FROM "material_ppo";
        `;


        // Convert BigInt to String for ALL results
        const formatBigInt = (row) => {
            return Object.fromEntries(
                Object.entries(row).map(([key, value]) => [
                    key, typeof value === 'bigint' ? value.toString().trim() : value
                ])
            );
        };

        const formattedConsumption = consumptionResult.map(formatBigInt);
        const formattedGrnStock = grnStockResult.map(formatBigInt);
        const formattedPpo = ppoResult.map(formatBigInt);

        // ✅ Convert materialId to STRING and TRIM in lookup maps
        const grnStockMap = new Map(
            formattedGrnStock.map(item => [
                item.materialId.toString().trim(),
                {
                    grnQuantity: Number(item.grnQuantity || 0),
                    stockQuantity: Number(item.stockQuantity || 0)
                }
            ])
        );

        const ppoMap = new Map(
            formattedPpo.map(item => [item.materialId.toString().trim(), item])
        );

        // ✅ Merge the Data with Correct Lookups
        const finalResult = formattedConsumption.map(item => {
            const materialId = item.materialId.toString().trim(); // Ensure string

            const grnStockData = grnStockMap.get(materialId) || { grnQuantity: 0, stockQuantity: 0 };

            return {
                materialId,
                description: item.details?.[0]?.description?.trim() || "N/A",
                consumption: Array.isArray(item.details) ? item.details.map(d => ({
                    monthYear: d.monthYear,
                    consumption: d.quantity
                })) : [],
                grnQuantity: grnStockData.grnQuantity, // ✅ Separate GRN Quantity
                stockQuantity: grnStockData.stockQuantity, // ✅ Separate Stock Quantity
                pendingQuantity: ppoMap.get(materialId)?.pendingQuantity || 0, // Lookup correctly
                supplier: ppoMap.get(materialId)?.supplier?.trim() || "N/A" // Trim supplier
            };
        });

        // Fetch total count for pagination
        const totalCountResult = await prisma.$queryRaw`
            SELECT COUNT(*)::bigint AS count FROM "ComputedMaterialConsumption";
        `;
        const totalCount = Number(totalCountResult[0]?.count || 0);

        // ✅ Send Final Response with Pagination
        res.send({
            totalItems: totalCount,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalCount / perPage),
            data: finalResult
        });

    } catch (error) {
        console.error("Error fetching material summary:", error);
        res.status(500).send({ message: error.message });
    }
});


app.get('/consumption-table/download', async (req, res) => {
    try {
        // Fetch all data without pagination
        const result = await prisma.$queryRaw`
            SELECT * FROM "ComputedMaterialConsumption";
        `;

        // Helper function to parse month-year and create a sortable date string
        const parseMonthYear = (monthYear) => {
            if (!monthYear) return null;
            const [month, year] = monthYear.split('-');
            const monthMap = {
                'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
            };
            return `${year}-${monthMap[month]}`;
        };

        // Get all unique month-year combinations across all materials
        const allMonthYears = new Set();
        result.forEach(row => {
            const details = Array.isArray(row.details) ? row.details : [];
            details.forEach(detail => {
                if (detail.monthYear) {
                    allMonthYears.add(detail.monthYear);
                }
            });
        });

        // Convert to array and sort chronologically
        const sortedMonthYears = Array.from(allMonthYears).sort((a, b) => {
            return parseMonthYear(a).localeCompare(parseMonthYear(b));
        });

        // Process and flatten the data
        const processedData = result.map(row => {
            // Parse the details array if it exists
            const details = Array.isArray(row.details) ? row.details : [];
            const firstDetail = details[0] || {};

            // Create consumption lookup map
            const consumptionByMonth = {};
            details.forEach(detail => {
                if (detail.monthYear && detail.quantity !== undefined) {
                    consumptionByMonth[detail.monthYear] = detail.quantity;
                }
            });

            // Create base object with computed fields
            const baseObject = {
                'Material ID': typeof row.materialId === 'bigint' ?
                    row.materialId.toString() : row.materialId,
                'Description': firstDetail.description || 'N/A',
                'Total Consumption': typeof row.totalConsumption === 'bigint' ?
                    row.totalConsumption.toString() : row.totalConsumption,
                'Maximum Consumption': typeof row.maxConsumption === 'bigint' ?
                    row.maxConsumption.toString() : row.maxConsumption,
                'Minimum Consumption': typeof row.minConsumption === 'bigint' ?
                    row.minConsumption.toString() : row.minConsumption,
                'Average Consumption': !isNaN(row.averageConsumption)
                    ? Math.round(Number(row.averageConsumption))
                    : "N/A",
            };

            // Add all month-year columns, even if no consumption data exists
            sortedMonthYears.forEach(monthYear => {
                baseObject[`Consumption ${monthYear}`] = consumptionByMonth[monthYear] || 0;
            });

            return baseObject;
        });

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Consumption Table');

        // Add headers
        const headers = Object.keys(processedData[0] || {});
        worksheet.columns = headers.map(header => ({
            header,
            key: header,
            width: Math.max(18, header.length + 2)
        }));

        // Add data
        worksheet.addRows(processedData);

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Apply number formatting and cell styling
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header row
                row.eachCell((cell, colNumber) => {
                    if (headers[colNumber - 1].includes('Consumption')) {
                        // Format consumption numbers with 2 decimal places
                        if (typeof cell.value === 'number') {
                            cell.numFmt = '#,##0.00';
                        }
                        // Highlight zero values with light gray background
                        if (cell.value === 0) {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFF5F5F5' }
                            };
                        }
                    }
                });
            }
        });

        // Format columns
        worksheet.columns.forEach(column => {
            column.alignment = {
                vertical: 'middle',
                horizontal: 'left'
            };
        });

        // Set content type and headers for file download
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=consumption-table.xlsx'
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Error generating Excel file:", error);
        res.status(500).send({ message: error.message });
    }
});


// app.get('/forecast-table/download', async (req, res) => {
//     try {
//         // Fetch all data without pagination
//         const result = await prisma.$queryRaw`
//             SELECT * FROM "material_avgconsumption_forecast_sap";
//         `;

//         // Convert BigInt values to strings
//         const processedData = result.map(row =>
//             Object.fromEntries(
//                 Object.entries(row).map(([key, value]) => [
//                     key, typeof value === 'bigint' ? value.toString() : value
//                 ])
//             )
//         );

//         // Create Excel workbook
//         const workbook = new ExcelJS.Workbook();
//         const worksheet = workbook.addWorksheet('Forecast Table');

//         // Add headers
//         const headers = Object.keys(processedData[0] || {});
//         worksheet.columns = headers.map(header => ({
//             header,
//             key: header,
//             width: Math.max(15, header.length + 2) // Dynamic width based on header length
//         }));

//         // Add data
//         worksheet.addRows(processedData);

//         // Style the header row
//         worksheet.getRow(1).font = { bold: true };
//         worksheet.getRow(1).fill = {
//             type: 'pattern',
//             pattern: 'solid',
//             fgColor: { argb: 'FFE0E0E0' }
//         };

//         // Auto-fit columns (optional, can be resource-intensive for large datasets)
//         worksheet.columns.forEach(column => {
//             column.alignment = { vertical: 'middle', horizontal: 'left' };
//         });

//         // Set content type and headers for file download
//         res.setHeader(
//             'Content-Type',
//             'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//         );
//         res.setHeader(
//             'Content-Disposition',
//             'attachment; filename=forecast-table.xlsx'
//         );

//         // Write to response
//         await workbook.xlsx.write(res);
//         res.end();

//     } catch (error) {
//         console.error("Error generating Excel file:", error);
//         res.status(500).send({ message: error.message });
//     }
// });


app.get('/forecast-table/download', async (req, res) => {
    try {
        // Fetch all data without pagination
        const result = await prisma.$queryRaw`
            SELECT * FROM "material_avgconsumption_forecast_sap";
        `;

        // Mapping database column names to desired column names
        const columnMappings = {
            materialid: "Material ID",
            material_description: "AMS Material Description",
            latest_forecast_month: "Month/Year",
            latest_forecast_value: "Forecasting for next month",
            avgconsumption: "3 Month Average Consumption",
            proposed_sap: "Proposed Quantity SAP (min-max)"
        };

        // Convert BigInt values to strings and apply transformations
        const processedData = result.map(row =>
            Object.fromEntries(
                Object.entries(row).map(([key, value]) => {
                    let newValue = value;

                    // Convert BigInt to string
                    if (typeof value === 'bigint') {
                        newValue = value.toString();
                    }

                    // Convert and round avgconsumption if it's a number
                    if (key === "avgconsumption" && !isNaN(value)) {
                        newValue = Math.round(Number(value).toFixed(2));
                    }

                    return [columnMappings[key] || key, newValue];
                })
            )
        );

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Forecast Table');

        // Add headers using mapped column names
        const headers = Object.values(columnMappings);
        worksheet.columns = headers.map(header => ({
            header,
            key: header,
            width: Math.max(15, header.length + 2) // Dynamic width based on header length
        }));

        // Add data
        worksheet.addRows(processedData);

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Auto-fit columns (optional, can be resource-intensive for large datasets)
        worksheet.columns.forEach(column => {
            column.alignment = { vertical: 'middle', horizontal: 'left' };
        });

        // Set content type and headers for file download
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=forecast-table.xlsx'
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Error generating Excel file:", error);
        res.status(500).send({ message: error.message });
    }
});


app.get('/material-summary/download', async (req, res) => {
    try {
        // Fetch all data without pagination
        const consumptionResult = await prisma.$queryRaw`
            SELECT "materialId", "totalConsumption", "details" 
            FROM "ComputedMaterialConsumption";
        `;

        const grnStockResult = await prisma.$queryRaw`
            SELECT "materialId", "stockQuantity" , "grnQuantity"
            FROM "material_grn_stock_view";
        `;

        const ppoResult = await prisma.$queryRaw`
            SELECT "materialId", "pendingQuantity", "supplier" 
            FROM "material_ppo";
        `;

        // Format BigInt values
        const formatBigInt = (row) => {
            return Object.fromEntries(
                Object.entries(row).map(([key, value]) => [
                    key, typeof value === 'bigint' ? value.toString().trim() : value
                ])
            );
        };

        const formattedConsumption = consumptionResult.map(formatBigInt);
        const formattedGrnStock = grnStockResult.map(formatBigInt);
        const formattedPpo = ppoResult.map(formatBigInt);

        // Create lookup maps
        const grnStockMap = new Map(
            formattedGrnStock.map(item => [item.materialId.toString().trim(), item])
        );
        const ppoMap = new Map(
            formattedPpo.map(item => [item.materialId.toString().trim(), item])
        );

        // Process data
        const processedData = formattedConsumption.map(item => {
            const materialId = item.materialId.toString().trim();
            const consumptionDetails = Array.isArray(item.details) ? item.details : [];

            return {
                'Material ID': materialId,
                'Description': item.details?.[0]?.description?.trim() || "N/A",
                'GRN': grnStockMap.get(materialId)?.grnQuantity || 0,
                'Stock': grnStockMap.get(materialId)?.stockQuantity || 0,
                'Pending Quantity': ppoMap.get(materialId)?.pendingQuantity || 0,
                'Supplier': ppoMap.get(materialId)?.supplier?.match(/\b\d+\b/g)?.join(", ") || "N/A",
                // Add last 6 months consumption if available
                ...consumptionDetails.reduce((acc, detail) => {
                    acc[`Consumption ${detail.monthYear}`] = detail.quantity;
                    return acc;
                }, {})
            };
        });

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Material Summary');

        // Add headers
        const headers = Object.keys(processedData[0]);
        worksheet.columns = headers.map(header => ({
            header,
            key: header,
            width: 15
        }));

        // Add data
        worksheet.addRows(processedData);

        // Style the header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
        };

        // Set content type and headers for file download
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename=material-summary.xlsx'
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Error generating Excel file:", error);
        res.status(500).send({ message: error.message });
    }
});


async function createView() {
    await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE VIEW "ComputedMaterialConsumption" AS
SELECT 
    m."materialId",
    COALESCE(SUM(mc."consumedQuantity"), 0) AS "totalConsumption",
    COALESCE(MAX(mc."consumedQuantity"), 0) AS "maxConsumption",
    COALESCE(MIN(mc."consumedQuantity"), 0) AS "minConsumption",
    COALESCE(AVG(mc."consumedQuantity"), 0) AS "averageConsumption",
    jsonb_agg(
        jsonb_build_object(
            'description', m."description",
            'monthYear', CONCAT(tm."Month", '-', tm."Year"),
            'quantity', mc."consumedQuantity"
        )
        ORDER BY tm."Year", 
        CASE tm."Month"
            WHEN 'Jan' THEN 1 WHEN 'Feb' THEN 2 WHEN 'Mar' THEN 3
            WHEN 'Apr' THEN 4 WHEN 'May' THEN 5 WHEN 'Jun' THEN 6
            WHEN 'Jul' THEN 7 WHEN 'Aug' THEN 8 WHEN 'Sep' THEN 9
            WHEN 'Oct' THEN 10 WHEN 'Nov' THEN 11 WHEN 'Dec' THEN 12
        END
    ) AS "details"
FROM "material_master" m
LEFT JOIN "material_consumption" mc ON m."materialId" = mc."materialId"
LEFT JOIN "time_master" tm ON mc."timeId" = tm."Time_Id"
WHERE 
    TO_DATE(
        LPAD(
            CASE tm."Month"
                WHEN 'Jan' THEN '1' WHEN 'Feb' THEN '2' WHEN 'Mar' THEN '3'
                WHEN 'Apr' THEN '4' WHEN 'May' THEN '5' WHEN 'Jun' THEN '6'
                WHEN 'Jul' THEN '7' WHEN 'Aug' THEN '8' WHEN 'Sep' THEN '9'
                WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12'
            END, 2, '0'
        ) || '-01-' || tm."Year", 'MM-DD-YYYY'
    ) 
    BETWEEN (
        SELECT DATE_TRUNC('month', MAX(
            TO_DATE(
                LPAD(
                    CASE tm2."Month"
                        WHEN 'Jan' THEN '1' WHEN 'Feb' THEN '2' WHEN 'Mar' THEN '3'
                        WHEN 'Apr' THEN '4' WHEN 'May' THEN '5' WHEN 'Jun' THEN '6'
                        WHEN 'Jul' THEN '7' WHEN 'Aug' THEN '8' WHEN 'Sep' THEN '9'
                        WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12'
                    END, 2, '0'
                ) || '-01-' || tm2."Year", 'MM-DD-YYYY'
            )
        ) - INTERVAL '11 months') FROM time_master tm2
    ) 
    AND (
        SELECT DATE_TRUNC('month', MAX(
            TO_DATE(
                LPAD(
                    CASE tm2."Month"
                        WHEN 'Jan' THEN '1' WHEN 'Feb' THEN '2' WHEN 'Mar' THEN '3'
                        WHEN 'Apr' THEN '4' WHEN 'May' THEN '5' WHEN 'Jun' THEN '6'
                        WHEN 'Jul' THEN '7' WHEN 'Aug' THEN '8' WHEN 'Sep' THEN '9'
                        WHEN 'Oct' THEN '10' WHEN 'Nov' THEN '11' WHEN 'Dec' THEN '12'
                    END, 2, '0'
                ) || '-01-' || tm2."Year", 'MM-DD-YYYY'
            )
        )) FROM time_master tm2
    )
GROUP BY m."materialId";

    `);

    console.log('Material_3Month_AvgConsumption created');

    await prisma.$executeRawUnsafe(
        `CREATE OR REPLACE VIEW Material_3Month_AvgConsumption AS 
        WITH LastThreeMonths AS (
            SELECT 
                DISTINCT tm."Year", tm."Month",
                TO_DATE(tm."Year"::TEXT || '-' || 
                    CASE 
                        WHEN tm."Month" = 'Jan' THEN '01'
                        WHEN tm."Month" = 'Feb' THEN '02'
                        WHEN tm."Month" = 'Mar' THEN '03'
                        WHEN tm."Month" = 'Apr' THEN '04'
                        WHEN tm."Month" = 'May' THEN '05'
                        WHEN tm."Month" = 'Jun' THEN '06'
                        WHEN tm."Month" = 'Jul' THEN '07'
                        WHEN tm."Month" = 'Aug' THEN '08'
                        WHEN tm."Month" = 'Sep' THEN '09'
                        WHEN tm."Month" = 'Oct' THEN '10'
                        WHEN tm."Month" = 'Nov' THEN '11'
                        WHEN tm."Month" = 'Dec' THEN '12'
                    END, 'YYYY-MM') AS DateValue
            FROM time_master tm
            ORDER BY DateValue DESC
            LIMIT 3
        )
        SELECT 
            m."materialId",
            m."description",
            COALESCE(SUM(mc."consumedQuantity"), 0) / 3.0 AS avgConsumption -- Ensuring 3 months are always considered
        FROM 
            material_master m
        LEFT JOIN 
            LastThreeMonths ltm 
            ON TRUE  -- This ensures we always consider 3 months
        LEFT JOIN 
            time_master tm 
            ON tm."Year" = ltm."Year" AND tm."Month" = ltm."Month"
        LEFT JOIN 
            material_consumption mc 
            ON m."materialId" = mc."materialId" 
            AND mc."timeId" = tm."Time_Id"
        GROUP BY 
            m."materialId", m."description";
    `)

    console.log('material_avgconsumption created');

    await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE VIEW "material_proposed_view" AS
        SELECT m."materialId",
    concat('(', p."reorderPt", '-', p."maxStk", ')') AS proposed_sap
   FROM proposed_sap p
     JOIN material_master m ON p."materialNo" = m."materialId";`
    )

    console.log('material_proposed_view created');

    await prisma.$executeRawUnsafe(`
        CREATE OR REPLACE VIEW material_avgconsumption_proposed AS 
        SELECT 
        m3."materialId",
        m3."avgconsumption", -- Use lowercase if PostgreSQL converted it
        mp."proposed_sap"
        FROM "material_3month_avgconsumption" m3
        JOIN "material_proposed_view" mp ON m3."materialId" = mp."materialId";

    `)

    console.log('material_avgconsumption_proposed created');

    await prisma.$executeRawUnsafe(`

        CREATE OR REPLACE VIEW material_avgconsumption_forecast_sap AS 
SELECT 
    macp."materialId" AS materialId,
    mm."description" AS material_description, -- Correct aliasing
    macp."avgconsumption" AS avgconsumption,
    macp."proposed_sap" AS proposed_sap,
    mf."monthYear" AS latest_forecast_month,
    mf."forecastingForNextMonth" AS latest_forecast_value
FROM "material_avgconsumption_proposed" macp
JOIN "material_forecasting" mf 
    ON macp."materialId" = mf."materialId"
JOIN "material_master" mm
    ON macp."materialId" = mm."materialId"
WHERE TO_DATE(
    '01-' || mf."monthYear", 'DD-Mon-YY'
) = (
    SELECT MAX(TO_DATE('01-' || mf2."monthYear", 'DD-Mon-YY'))
    FROM "material_forecasting" mf2 
    WHERE mf2."materialId" = macp."materialId"
);
    `)

    console.log('material_avgconsumption_forecast_sap created');

    //old view
    // await prisma.$executeRawUnsafe(`

    //         CREATE OR REPLACE VIEW material_grn_stock_view AS
    // SELECT 
    //     COALESCE("material_stock"."materialId", "material_grn"."materialId") AS "materialId",
    //     COALESCE("material_stock"."quantity", 0) + COALESCE("material_grn"."quantity", 0) AS "grnPlusStock"
    // FROM "material_stock"
    // FULL JOIN "material_grn" ON "material_stock"."materialId" = "material_grn"."materialId";

    //     `)

    await prisma.$executeRawUnsafe(`

            CREATE OR REPLACE VIEW material_grn_stock_view AS 
    SELECT 
        COALESCE("material_stock"."materialId", "material_grn"."materialId") AS "materialId",
        COALESCE("material_stock"."quantity", 0) AS "stockQuantity",
        COALESCE("material_grn"."quantity", 10) AS "grnQuantity"
    FROM "material_stock" 
    FULL JOIN "material_grn" 
        ON "material_stock"."materialId" = "material_grn"."materialId";
        `)

    console.log('material_grn_stock_view created');

    await prisma.$executeRawUnsafe(`
    
        CREATE OR REPLACE VIEW material_summary_view AS 
WITH consumption_details AS (
    SELECT 
        "ComputedMaterialConsumption"."materialId",
        jsonb_agg(
            jsonb_build_object('monthYear', x."monthYear", 'consumption', x.quantity)
        ) AS consumption,
        max(x.description) AS description
    FROM "ComputedMaterialConsumption",
        LATERAL jsonb_array_elements("ComputedMaterialConsumption".details) d(value),
        LATERAL jsonb_to_record(d.value) x("monthYear" text, quantity numeric, description text)
    GROUP BY "ComputedMaterialConsumption"."materialId"
)
SELECT 
    c."materialId",
    COALESCE(c.description, 'N/A'::text) AS description,
    c.consumption,
    COALESCE(gs."stockQuantity", 0) AS "stockQuantity",
    COALESCE(gs."grnQuantity", 0) AS "grnQuantity",
    COALESCE(p."pendingQuantity", 0) AS "pendingQuantity",
    COALESCE(p.supplier, 'N/A'::text) AS supplier
FROM consumption_details c
LEFT JOIN material_grn_stock_view gs ON c."materialId" = gs."materialId"::text
LEFT JOIN material_ppo p ON c."materialId" = p."materialId"::text;

    `)



    console.log('material_summary view created');
}

// Start server
const PORT = process.env.PORT || 8000;

// const options = {
//     key: fs.readFileSync('./certs/server.key'),
//     cert: fs.readFileSync('./certs/server.cert')
// };

// https.createServer(options, app).listen(8000, async () => {
//     console.log('HTTPS Server running on port 8000');
//     try {
//         await prisma.$connect();
//         await createView();
//         console.log('Connected to database');
//     } catch (error) {
//         console.error('Database connection failed', error);
//     }
// });


app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    try {
        await prisma.$connect();
        await createView();
        console.log('Connected to database');
    } catch (error) {
        console.error('Database connection failed', error);
    }
});

// Handle shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit();
});
