#!/usr/bin/env node

const fs = require('fs');

// Read the public test cases
const publicCases = JSON.parse(fs.readFileSync('public_cases.json', 'utf8'));

console.log('Ultra-deep analysis to crack the algorithm...\n');

// Group all cases by days to find exact patterns
const byDays = {};
publicCases.forEach(c => {
    const days = c.input.trip_duration_days;
    if (!byDays[days]) byDays[days] = [];
    byDays[days].push(c);
});

// For each day group, find the exact formula
Object.keys(byDays).sort((a, b) => a - b).forEach(days => {
    const cases = byDays[days];
    console.log(`\n=== ${days} DAY TRIPS (${cases.length} cases) ===`);
    
    // Try to find a consistent formula for this day length
    const analysis = cases.map(c => {
        const { miles_traveled: miles, total_receipts_amount: receipts } = c.input;
        const expected = c.expected_output;
        const spendPerDay = receipts / days;
        const milesPerDay = miles / days;
        
        // Try different base formulas
        const formulas = [
            { name: 'base_85_65', value: days * 85 + miles * 0.65 },
            { name: 'base_90_58', value: days * 90 + miles * 0.58 },
            { name: 'base_100_50', value: days * 100 + miles * 0.50 }
        ];
        
        const result = { 
            miles, receipts, expected, spendPerDay, milesPerDay,
            formulas: {}
        };
        
        formulas.forEach(f => {
            const receiptFactor = receipts > 0 ? (expected - f.value) / receipts : 0;
            result.formulas[f.name] = {
                base: f.value,
                receiptFactor: receiptFactor,
                predicted: f.value + receipts * receiptFactor
            };
        });
        
        return result;
    });
    
    // Find the most consistent base formula
    const bestBase = ['base_85_65', 'base_90_58', 'base_100_50'].map(baseName => {
        const factors = analysis.map(a => a.formulas[baseName].receiptFactor);
        const mean = factors.reduce((sum, f) => sum + f, 0) / factors.length;
        const variance = factors.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) / factors.length;
        
        return { baseName, mean, variance, stdDev: Math.sqrt(variance) };
    }).sort((a, b) => a.stdDev - b.stdDev);
    
    const best = bestBase[0];
    console.log(`Best base formula: ${best.baseName}, receipt factor: ${best.mean.toFixed(3)} ± ${best.stdDev.toFixed(3)}`);
    
    // Look for patterns in the receipt factors
    const factors = analysis.map(a => a.formulas[best.baseName].receiptFactor);
    const sorted = [...factors].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const q25 = sorted[Math.floor(sorted.length * 0.25)];
    const q75 = sorted[Math.floor(sorted.length * 0.75)];
    
    console.log(`Receipt factor distribution: Q25=${q25.toFixed(3)}, median=${median.toFixed(3)}, Q75=${q75.toFixed(3)}`);
    
    // Find outliers and their patterns
    const outliers = analysis.filter(a => {
        const factor = a.formulas[best.baseName].receiptFactor;
        return Math.abs(factor - best.mean) > 2 * best.stdDev;
    });
    
    if (outliers.length > 0) {
        console.log(`Found ${outliers.length} outliers:`);
        outliers.slice(0, 5).forEach(o => {
            const factor = o.formulas[best.baseName].receiptFactor;
            console.log(`  ${o.miles}mi, $${o.receipts.toFixed(2)} → factor ${factor.toFixed(3)} (spend/day: $${o.spendPerDay.toFixed(2)}, mi/day: ${o.milesPerDay.toFixed(1)})`);
        });
        
        // Look for patterns in outliers
        const highSpendOutliers = outliers.filter(o => o.spendPerDay > 200);
        const lowSpendOutliers = outliers.filter(o => o.spendPerDay < 50);
        const highMilesOutliers = outliers.filter(o => o.milesPerDay > 200);
        const lowMilesOutliers = outliers.filter(o => o.milesPerDay < 50);
        
        if (highSpendOutliers.length > 0) {
            const avgFactor = highSpendOutliers.reduce((sum, o) => sum + o.formulas[best.baseName].receiptFactor, 0) / highSpendOutliers.length;
            console.log(`  High spend outliers (${highSpendOutliers.length}): avg factor ${avgFactor.toFixed(3)}`);
        }
        if (lowSpendOutliers.length > 0) {
            const avgFactor = lowSpendOutliers.reduce((sum, o) => sum + o.formulas[best.baseName].receiptFactor, 0) / lowSpendOutliers.length;
            console.log(`  Low spend outliers (${lowSpendOutliers.length}): avg factor ${avgFactor.toFixed(3)}`);
        }
        if (highMilesOutliers.length > 0) {
            const avgFactor = highMilesOutliers.reduce((sum, o) => sum + o.formulas[best.baseName].receiptFactor, 0) / highMilesOutliers.length;
            console.log(`  High miles outliers (${highMilesOutliers.length}): avg factor ${avgFactor.toFixed(3)}`);
        }
        if (lowMilesOutliers.length > 0) {
            const avgFactor = lowMilesOutliers.reduce((sum, o) => sum + o.formulas[best.baseName].receiptFactor, 0) / lowMilesOutliers.length;
            console.log(`  Low miles outliers (${lowMilesOutliers.length}): avg factor ${avgFactor.toFixed(3)}`);
        }
    }
});

// Try to find an overall pattern that works across all days
console.log('\n=== OVERALL ANALYSIS ===');

// Test if different day ranges need different approaches
const ranges = [
    { name: 'Short (1-3)', filter: c => c.input.trip_duration_days <= 3 },
    { name: 'Medium (4-7)', filter: c => c.input.trip_duration_days >= 4 && c.input.trip_duration_days <= 7 },
    { name: 'Long (8-11)', filter: c => c.input.trip_duration_days >= 8 && c.input.trip_duration_days <= 11 },
    { name: 'Very Long (12+)', filter: c => c.input.trip_duration_days >= 12 }
];

ranges.forEach(range => {
    const cases = publicCases.filter(range.filter);
    console.log(`\n${range.name} trips (${cases.length} cases):`);
    
    // Test different coefficient combinations
    const coeffs = [
        [80, 0.70, 0.35],
        [85, 0.65, 0.30],
        [90, 0.60, 0.35],
        [95, 0.55, 0.40]
    ];
    
    coeffs.forEach(([dayCoeff, mileCoeff, receiptCoeff]) => {
        let totalError = 0;
        cases.forEach(c => {
            const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = c.input;
            const expected = c.expected_output;
            const predicted = days * dayCoeff + miles * mileCoeff + receipts * receiptCoeff;
            const error = Math.abs(expected - predicted);
            totalError += error;
        });
        const avgError = totalError / cases.length;
        console.log(`  [${dayCoeff}, ${mileCoeff}, ${receiptCoeff}]: ${avgError.toFixed(2)}`);
    });
});