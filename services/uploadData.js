import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import prisma from '../utils/db.js';
import { fileURLToPath } from 'url';

// Convert import.meta.url to directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parentDir = path.resolve(__dirname, '..');

const uploadsDir = path.join(parentDir, 'uploads');

async function processMaterialMasterCSV() {
    const csvFileName = 'material_master.csv';
    const csvFilePath = path.join(uploadsDir, csvFileName);

    if (!fs.existsSync(csvFilePath)) {
        console.log('material_master.csv not found in uploads folder');
        throw new Error('material_master.csv not found in uploads folder');
    }

    const records = [];
    const requiredColumns = ['Material ID', 'Material Description'];

    await new Promise((resolve, reject) => {
        const stream = fs.createReadStream(csvFilePath)
            .pipe(csv());

        stream.on('headers', (headers) => {
            const missingColumns = requiredColumns.filter(col => !headers.includes(col));
            if (missingColumns.length > 0) {
                stream.destroy();
                reject(new Error(`Invalid CSV format. Missing columns: ${missingColumns.join(', ')}`));
            }
        });

        stream.on('data', (row) => {

            if (Object.values(row).every(value => !value || value.toString().trim() === '')) {

                return;
            }

            if (!row['Material ID']) {
                stream.destroy();
                reject(new Error('Invalid row: Material ID is required'));
                return;
            }

            if (!row['Material Description']) {
                stream.destroy();
                reject(new Error(`Invalid row: Material Description is required for Material ID: ${row['Material ID']}`));
                return;
            }

            records.push({
                materialId: row['Material ID'],
                description: row['Material Description'],
            });
        });

        stream.on('end', async () => {
            try {
                for (const record of records) {
                    await prisma.material.upsert({
                        where: { materialId: record.materialId },
                        update: { description: record.description },
                        create: { materialId: record.materialId, description: record.description },
                    });
                }
                fs.unlinkSync(csvFilePath);
                console.log(`Processed and deleted ${csvFileName}`);
                resolve();
            } catch (error) {
                if (error.code === 'EBUSY') {
                    reject(new Error('The CSV file is currently open. Please close any open CSV files and delete them manually'));
                } else {
                    reject(new Error(`Error processing CSV: ${error.message}`));
                }
            }
        });

        stream.on('error', (error) => {
            stream.destroy();
            reject(new Error(`Error reading CSV: ${error.message}`));
        });
    });
}

async function processTimeMasterCSV() {
    const csvFileName = 'time_master.csv';
    const csvFilePath = path.join(uploadsDir, csvFileName);

    if (!fs.existsSync(csvFilePath)) {
        console.log('time_master.csv not found in uploads folder');
        throw new Error('time_master.csv not found in uploads folder');
    }

    const records = [];
    const requiredColumns = ['Time_Id', 'Month', 'Year'];

    await new Promise((resolve, reject) => {
        const stream = fs.createReadStream(csvFilePath)
            .pipe(csv());

        stream.on('headers', (headers) => {
            const missingColumns = requiredColumns.filter(col => !headers.includes(col));
            if (missingColumns.length > 0) {
                stream.destroy();
                reject(new Error(`Invalid CSV format. Missing columns: ${missingColumns.join(', ')}`));
            }
        });

        stream.on('data', (row) => {

            if (Object.values(row).every(value => !value || value.toString().trim() === '')) {

                return;
            }

            if (!row['Time_Id']) {
                stream.destroy();
                reject(new Error('Invalid row: Time_Id is required'));
                return;
            }

            if (!row['Month']) {
                stream.destroy();
                reject(new Error(`Invalid row: Month is required for Time_Id: ${row['Time_Id']}`));
                return;
            }

            const year = parseInt(row['Year'], 10);
            if (isNaN(year)) {
                stream.destroy();
                reject(new Error(`Invalid Year value for Time_Id: ${row['Time_Id']}`));
                return;
            }

            records.push({
                timeId: row['Time_Id'],
                month: row['Month'],
                year: year,
            });
        });

        stream.on('end', async () => {
            try {
                for (const record of records) {
                    await prisma.TimeMaster.upsert({
                        where: { Time_Id: record.timeId },
                        update: {
                            Month: record.month,
                            Year: record.year,
                        },
                        create: {
                            Time_Id: record.timeId,
                            Month: record.month,
                            Year: record.year,
                        },
                    });
                }
                fs.unlinkSync(csvFilePath);
                console.log(`Processed and deleted ${csvFileName}`);
                resolve();
            } catch (error) {
                if (error.code === 'EBUSY') {
                    reject(new Error('The CSV file is currently open. Please close any open CSV files and delete them manually'));
                } else {
                    reject(new Error(`Error processing CSV: ${error.message}`));
                }
            }
        });

        stream.on('error', (error) => {
            stream.destroy();
            reject(new Error(`Error reading CSV: ${error.message}`));
        });
    });
}

async function processMaterialConsumptionCSV() {
    const csvFileName = 'material_consumption.csv';
    const csvFilePath = path.join(uploadsDir, csvFileName);

    if (!fs.existsSync(csvFilePath)) {
        console.log('material_consumption.csv not found in uploads folder');
        throw new Error('material_consumption.csv not found in uploads folder');
    }

    const records = [];
    const requiredColumns = ['Time Id', 'Material ID', 'Consumed_Quantity'];

    await new Promise((resolve, reject) => {
        const stream = fs.createReadStream(csvFilePath)
            .pipe(csv());

        stream.on('headers', (headers) => {
            const missingColumns = requiredColumns.filter(col => !headers.includes(col));
            if (missingColumns.length > 0) {
                stream.destroy();
                reject(new Error(`Invalid CSV format. Missing columns: ${missingColumns.join(', ')}`));
            }
        });

        stream.on('data', (row) => {

            if (Object.values(row).every(value => !value || value.toString().trim() === '')) {
                // Find which values are empty or missing
                const missingValues = Object.keys(row).filter(key => !row[key] || row[key].toString().trim() === '');


                return;
            }

            if (!row['Time Id']) {
                stream.destroy();
                reject(new Error('Invalid row: Time Id is required'));
                return;
            }

            if (!row['Material ID']) {
                stream.destroy();
                reject(new Error(`Invalid row: Material ID is required for Time Id: ${row['Time Id']}`));
                return;
            }

            const quantity = parseInt(row['Consumed_Quantity'], 10);
            if (isNaN(quantity)) {
                stream.destroy();
                reject(new Error(`Invalid Consumed_Quantity value for Material ID: ${row['Material ID']} and Time Id: ${row['Time Id']}`));
                return;
            }

            records.push({
                timeId: row['Time Id'],
                materialId: row['Material ID'],
                consumedQuantity: quantity,
            });
        });

        stream.on('end', async () => {
            try {
                for (const record of records) {
                    await prisma.materialConsumption.upsert({
                        where: { timeId_materialId: { timeId: record.timeId, materialId: record.materialId } },
                        update: {
                            consumedQuantity: record.consumedQuantity,
                        },
                        create: {
                            timeId: record.timeId,
                            materialId: record.materialId,
                            consumedQuantity: record.consumedQuantity,
                        },
                    });
                }
                fs.unlinkSync(csvFilePath);
                console.log(`Processed and deleted ${csvFileName}`);
                resolve();
            } catch (error) {
                if (error.code === 'EBUSY') {
                    reject(new Error('The CSV file is currently open. Please close any open CSV files and delete them manually'));
                } else {
                    reject(new Error(`Error processing CSV: ${error.message}`));
                }
            }
        });

        stream.on('error', (error) => {
            stream.destroy();
            reject(new Error(`Error reading CSV: ${error.message}`));
        });
    });
}

async function processMaterialForecastingCSV() {
    const csvFileName = 'forecasting.csv';
    const csvFilePath = path.join(uploadsDir, csvFileName);

    if (!fs.existsSync(csvFilePath)) {
        console.log('material_forecasting.csv not found in uploads folder');
        throw new Error('material_forecasting.csv not found in uploads folder');
    }

    const records = [];
    const requiredColumns = ['MATERIAL ID', 'MONTH/YEAR', 'FORECASTING FOR NEXT MONTH'];

    await new Promise((resolve, reject) => {
        const stream = fs.createReadStream(csvFilePath)
            .pipe(csv());

        stream.on('headers', (headers) => {
            const missingColumns = requiredColumns.filter(col => !headers.includes(col));
            if (missingColumns.length > 0) {
                stream.destroy();
                reject(new Error(`Invalid CSV format. Missing columns: ${missingColumns.join(', ')}`));
            }
        });

        stream.on('data', (row) => {

            if (Object.values(row).every(value => !value || value.toString().trim() === '')) {
                return;
            }

            if (!row['MATERIAL ID']) {
                stream.destroy();
                reject(new Error('Invalid row: MATERIAL ID is required'));
                return;
            }

            if (!row['MONTH/YEAR']) {
                stream.destroy();
                reject(new Error(`Invalid row: MONTH/YEAR is required for Material ID: ${row['MATERIAL ID']}`));
                return;
            }

            const forecast = parseInt(row['FORECASTING FOR NEXT MONTH'], 10);
            if (isNaN(forecast)) {
                stream.destroy();
                reject(new Error(`Invalid FORECASTING FOR NEXT MONTH value for Material ID: ${row['MATERIAL ID']}`));
                return;
            }

            records.push({
                materialId: row['MATERIAL ID'],
                monthYear: row['MONTH/YEAR'],
                forecastingForNextMonth: forecast,
            });
        });

        stream.on('end', async () => {
            try {
                for (const record of records) {
                    await prisma.materialForecasting.upsert({
                        where: {
                            materialId_monthYear: {
                                materialId: record.materialId,
                                monthYear: record.monthYear
                            }
                        },
                        update: {
                            forecastingForNextMonth: record.forecastingForNextMonth,
                        },
                        create: {
                            materialId: record.materialId,
                            monthYear: record.monthYear,
                            forecastingForNextMonth: record.forecastingForNextMonth,
                        },
                    });
                }
                fs.unlinkSync(csvFilePath);
                console.log(`Processed and deleted ${csvFileName}`);
                resolve();
            } catch (error) {
                if (error.code === 'EBUSY') {
                    reject(new Error('The CSV file is currently open. Please close any open CSV files and delete them manually'));
                } else {
                    reject(new Error(`Error processing CSV: ${error.message}`));
                }
            }
        });

        stream.on('error', (error) => {
            stream.destroy();
            reject(new Error(`Error reading CSV: ${error.message}`));
        });
    });
}


async function processProposedSapCSV() {
    const csvFileName = 'sap.csv';
    const csvFilePath = path.join(uploadsDir, csvFileName);

    if (!fs.existsSync(csvFilePath)) {
        console.log('sap.csv not found in uploads folder');
        throw new Error('sap.csv not found in uploads folder');
    }

    const records = [];
    const requiredColumns = ['Material No', 'Reorder Pt', 'Max Stk'];

    await new Promise((resolve, reject) => {
        const stream = fs.createReadStream(csvFilePath)
            .pipe(csv());

        stream.on('headers', (headers) => {
            const missingColumns = requiredColumns.filter(col => !headers.includes(col));
            if (missingColumns.length > 0) {
                stream.destroy();
                reject(new Error(`Invalid CSV format. Missing columns: ${missingColumns.join(', ')}`));
            }
        });

        stream.on('data', (row) => {

            if (Object.values(row).every(value => !value || value.toString().trim() === '')) {

                return;
            }

            if (!row['Material No']) {
                return;
            }


            const reorderPt = parseInt(row['Reorder Pt'], 10);
            const maxStk = parseInt(row['Max Stk'], 10);

            if (isNaN(reorderPt)) {
                stream.destroy();
                reject(new Error(`Invalid Reorder Pt value for Material No: ${row['Material No']}`));
                return;
            }
            if (isNaN(maxStk)) {
                stream.destroy();
                reject(new Error(`Invalid Max Stk value for Material No: ${row['Material No']}`));
                return;
            }

            records.push({
                materialNo: row['Material No'],
                reorderPt: reorderPt,
                maxStk: maxStk,
            });
        });

        stream.on('end', async () => {
            try {
                for (const record of records) {
                    await prisma.proposedQuantity.upsert({
                        where: { materialNo: record.materialNo },
                        update: {
                            reorderPt: record.reorderPt,
                            maxStk: record.maxStk,
                        },
                        create: {
                            materialNo: record.materialNo,
                            reorderPt: record.reorderPt,
                            maxStk: record.maxStk,
                        },
                    });
                }
                fs.unlinkSync(csvFilePath);
                console.log(`Processed and deleted ${csvFileName}`);
                resolve();
            } catch (error) {
                if (error.code === 'EBUSY') {
                    reject(new Error('The CSV file is currently open. Please close any open CSV files and delete them manually.'));
                } else {
                    reject(new Error(`Error processing CSV: ${error.message}`));
                }
            }
        });

        stream.on('error', (error) => {
            stream.destroy();
            reject(new Error(`Error reading CSV: ${error.message}`));
        });
    });
}

async function processGrnCSV() {
    const csvFileName = 'grn.csv';
    const csvFilePath = path.join(uploadsDir, csvFileName);

    if (!fs.existsSync(csvFilePath)) {
        console.log(`${csvFileName} not found in uploads folder`);
        throw new Error(`${csvFileName} not found in uploads folder`);
    }

    const records = [];
    const requiredColumns = ['Material', 'Qty in unit of entry'];

    await prisma.materialGrn.deleteMany(); // Delete existing data before processing new CSV

    await new Promise((resolve, reject) => {
        const stream = fs.createReadStream(csvFilePath).pipe(csv());

        stream.on('headers', (headers) => {
            const trimmedHeaders = headers.map(header => header.trim().toLowerCase());
            const expectedHeaders = requiredColumns.map(col => col.toLowerCase());

            const missingColumns = expectedHeaders.filter(col => !trimmedHeaders.includes(col));
            console.log('Missing columns:');
            console.log(missingColumns)
            if (missingColumns.length > 0) {
                stream.destroy();
                reject(new Error(`Invalid CSV format. Missing columns: ${missingColumns.join(', ')}`));
            }
        });

        stream.on('data', (row) => {

            const materialKey = Object.keys(row).find(key => key.trim().toLowerCase() === 'material');

            if (Object.values(row).every(value => !value || value.toString().trim() === '')) {
                return;
            }

            if (!materialKey || !row[materialKey].trim()) {
                stream.destroy();
                reject(new Error('Invalid row: Material is required'));
                return;
            }

            const materialId = parseInt(row[materialKey], 10);
            const quantity = parseInt(row['Qty in unit of entry'], 10);

            if (isNaN(materialId)) {
                stream.destroy();
                reject(new Error(`Invalid Material ID: ${row['Material']}`));
                return;
            }
            if (isNaN(quantity)) {
                stream.destroy();
                reject(new Error(`Invalid quantity value for Material ID: ${materialId}`));
                return;
            }

            records.push({ materialId, quantity });
        });

        stream.on('end', async () => {
            try {
                for (const record of records) {
                    const existingRecord = await prisma.materialGrn.findUnique({
                        where: { materialId: record.materialId }
                    });

                    if (existingRecord) {
                        await prisma.materialGrn.update({
                            where: { materialId: record.materialId },
                            data: { quantity: existingRecord.quantity + record.quantity },
                        });
                    } else {
                        await prisma.materialGrn.create({
                            data: { materialId: record.materialId, quantity: record.quantity },
                        });
                    }
                }
                fs.unlinkSync(csvFilePath);
                console.log(`Processed and deleted ${csvFileName}`);
                resolve();
            } catch (error) {
                if (error.code === 'EBUSY') {
                    reject(new Error('The CSV file is currently open. Please close any open CSV files and delete them manually.'));
                } else {
                    reject(new Error(`Error processing CSV: ${error.message}`));
                }
            }
        });

        stream.on('error', (error) => {
            stream.destroy();
            reject(new Error(`Error reading CSV: ${error.message}`));
        });
    });
}

async function processStockCSV() {
    const csvFileName = 'stock.csv';
    const csvFilePath = path.join(uploadsDir, csvFileName);

    if (!fs.existsSync(csvFilePath)) {
        console.log(`${csvFileName} not found in uploads folder`);
        throw new Error(`${csvFileName} not found in uploads folder`);
    }

    const records = [];
    const requiredColumns = ['Material', 'Total Qty'];

    await prisma.materialStock.deleteMany(); // Delete existing data before processing new CSV
    console.log('Deleted existing data in material_stock table');

    await new Promise((resolve, reject) => {
        const stream = fs.createReadStream(csvFilePath).pipe(csv());

        stream.on('headers', (headers) => {
            const trimmedHeaders = headers.map(header => header.trim().toLowerCase());
            const expectedHeaders = requiredColumns.map(col => col.toLowerCase());

            const missingColumns = expectedHeaders.filter(col => !trimmedHeaders.includes(col));
            console.log('Missing columns:', missingColumns);
            if (missingColumns.length > 0) {
                stream.destroy();
                reject(new Error(`Invalid CSV format. Missing columns: ${missingColumns.join(', ')}`));
            }
        });

        stream.on('data', (row) => {

            const materialKey = Object.keys(row).find(key => key.trim().toLowerCase() === 'material');

            if (Object.values(row).every(value => !value || value.toString().trim() === '')) {

                return;
            }

            if (!materialKey || !row[materialKey].trim()) {
                stream.destroy();
                reject(new Error('Invalid row: Material is required'));
                return;
            }

            const materialId = parseInt(row[materialKey], 10);
            const quantity = parseInt(row['Total Qty'], 10);

            if (isNaN(materialId)) {
                stream.destroy();
                reject(new Error(`Invalid Material ID: ${row['Material']}`));
                return;
            }
            if (isNaN(quantity)) {
                stream.destroy();
                reject(new Error(`Invalid quantity value for Material ID: ${materialId}`));
                return;
            }

            records.push({ materialId, quantity });
        });

        stream.on('end', async () => {
            try {
                for (const record of records) {
                    const existingRecord = await prisma.materialStock.findUnique({
                        where: { materialId: record.materialId }
                    });

                    if (existingRecord) {
                        await prisma.materialStock.update({
                            where: { materialId: record.materialId },
                            data: { quantity: existingRecord.quantity + record.quantity },
                        });
                    } else {
                        await prisma.materialStock.create({
                            data: { materialId: record.materialId, quantity: record.quantity },
                        });
                    }
                }
                fs.unlinkSync(csvFilePath);
                console.log(`Processed and deleted ${csvFileName}`);
                resolve();
            } catch (error) {
                reject(new Error(`Error processing CSV: ${error.message}`));
            }
        });

        stream.on('error', (error) => {
            stream.destroy();
            reject(new Error(`Error reading CSV: ${error.message}`));
        });
    });
}

async function processPpoCSV() {
    const csvFileName = 'ppo.csv';
    const csvFilePath = path.join(uploadsDir, csvFileName);

    if (!fs.existsSync(csvFilePath)) {
        console.log(`${csvFileName} not found in uploads folder`);
        throw new Error(`${csvFileName} not found in uploads folder`);
    }

    const records = new Map(); // Store summed quantities and concatenated suppliers
    const requiredColumns = ['Material', 'Supplier/Supplying Plant', 'Still to be delivered (qty)'];

    // Delete existing data before inserting new ones
    await prisma.materialPpo.deleteMany();
    console.log('Deleted existing data in material_ppo table');

    await new Promise((resolve, reject) => {
        const stream = fs.createReadStream(csvFilePath).pipe(csv());

        stream.on('headers', (headers) => {
            console.log('Headers:', headers);
            const trimmedHeaders = headers.map(header => header.trim().toLowerCase());
            const expectedHeaders = requiredColumns.map(col => col.toLowerCase());

            const missingColumns = expectedHeaders.filter(col => !trimmedHeaders.includes(col));
            if (missingColumns.length > 0) {
                stream.destroy();
                reject(new Error(`Invalid CSV format. Missing columns: ${missingColumns.join(', ')}`));
            }
        });

        stream.on('data', (row) => {

            const materialKey = Object.keys(row).find(key => key.trim().toLowerCase() === 'material');
            const supplierKey = Object.keys(row).find(key => key.trim().toLowerCase() === 'supplier/supplying plant');
            const quantityKey = Object.keys(row).find(key => key.trim().toLowerCase() === 'still to be delivered (qty)');

            if (Object.values(row).every(value => !value || value.toString().trim() === '')) {

                return;
            }

            if (!materialKey || !supplierKey || !quantityKey || !row[materialKey].trim()) {
                stream.destroy();
                reject(new Error('Invalid row: Material, Supplier, and Quantity are required'));
                return;
            }

            const materialId = parseInt(row[materialKey], 10);
            const pendingQuantity = parseInt(row[quantityKey], 10);
            const supplier = row[supplierKey].trim();

            if (isNaN(materialId)) {
                stream.destroy();
                reject(new Error(`Invalid Material ID: ${row[materialKey]}`));
                return;
            }
            if (isNaN(pendingQuantity)) {
                stream.destroy();
                reject(new Error(`Invalid quantity value for Material ID: ${materialId}`));
                return;
            }

            // If materialId exists, update sum and concatenate suppliers
            if (records.has(materialId)) {
                const existing = records.get(materialId);
                records.set(materialId, {
                    pendingQuantity: existing.pendingQuantity + pendingQuantity,
                    supplier: existing.supplier.includes(supplier) ? existing.supplier : existing.supplier + ', ' + supplier
                });
            } else {
                records.set(materialId, { pendingQuantity, supplier });
            }
        });

        stream.on('end', async () => {
            try {
                for (const [materialId, data] of records.entries()) {
                    await prisma.materialPpo.create({
                        data: {
                            materialId,
                            pendingQuantity: data.pendingQuantity,
                            supplier: data.supplier
                        },
                    });
                }
                fs.unlinkSync(csvFilePath);
                console.log(`Processed and deleted ${csvFileName}`);
                resolve();
            } catch (error) {
                if (error.code === 'EBUSY') {
                    reject(new Error('The CSV file is currently open. Please close any open CSV files and delete them manually.'));
                } else {
                    reject(new Error(`Error processing CSV: ${error.message}`));
                }
            }
        });

        stream.on('error', (error) => {
            stream.destroy();
            reject(new Error(`Error reading CSV: ${error.message}`));
        });
    });
}

export { processMaterialMasterCSV, processTimeMasterCSV, processMaterialConsumptionCSV, processMaterialForecastingCSV, processProposedSapCSV, processGrnCSV, processStockCSV, processPpoCSV };