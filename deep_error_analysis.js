#!/usr/bin/env node

const fs = require('fs');

// Read the public test cases
const publicCases = JSON.parse(fs.readFileSync('public_cases.json', 'utf8'));

console.log('Deep analysis of specific high-error cases...\n');

// The exact error cases from evaluation
const errorCases = [
    { days: 8, miles: 795, receipts: 1645.99, expected: 644.69 },
    { days: 11, miles: 740, receipts: 1171.99, expected: 902.09 },
    { days: 1, miles: 1082, receipts: 1809.49, expected: 446.94 },
    { days: 8, miles: 482, receipts: 1411.49, expected: 631.81 },
    { days: 5, miles: 516, receipts: 1878.49, expected: 669.85 }
];

console.log('Detailed analysis of each error case:');

errorCases.forEach((testCase, index) => {
    const { days, miles, receipts, expected } = testCase;
    
    // Calculate base
    let perDayRate = 100;
    if (days >= 14) perDayRate = 60;
    else if (days >= 12) perDayRate = 70;
    else if (days >= 10) perDayRate = 80;
    else if (days >= 8) perDayRate = 90;
    
    const base = days * perDayRate + miles * 0.58;
    const receiptFactor = (expected - base) / receipts;
    const spendPerDay = receipts / days;
    const milesPerDay = miles / days;
    
    console.log(`\nCase ${index + 1}: ${days} days, ${miles} miles, $${receipts}`);
    console.log(`  Expected: $${expected}, Base: $${base.toFixed(2)}`);
    console.log(`  Need factor: ${receiptFactor.toFixed(3)}`);
    console.log(`  Spend/day: $${spendPerDay.toFixed(2)}, Miles/day: ${milesPerDay.toFixed(1)}`);
    
    // Look for patterns
    const receiptToMilesRatio = receipts / miles;
    const receiptToDaysRatio = receipts / days;
    const milesToDaysRatio = miles / days;
    
    console.log(`  Ratios: R/M=${receiptToMilesRatio.toFixed(2)}, R/D=${receiptToDaysRatio.toFixed(2)}, M/D=${milesToDaysRatio.toFixed(1)}`);
    
    // Check if it's a high efficiency case
    const efficiency = miles / days;
    if (efficiency > 100) {
        console.log(`  *** HIGH EFFICIENCY: ${efficiency.toFixed(1)} miles/day ***`);
    }
    
    // Check if it's a high spending case
    if (spendPerDay > 150) {
        console.log(`  *** HIGH SPENDING: $${spendPerDay.toFixed(2)}/day ***`);
    }
});

// Look for similar patterns in the dataset
console.log('\n\nSearching for similar patterns in full dataset...');

// High efficiency + high spending cases
const highEfficiencyHighSpending = publicCases.filter(c => {
    const efficiency = c.input.miles_traveled / c.input.trip_duration_days;
    const spendPerDay = c.input.total_receipts_amount / c.input.trip_duration_days;
    return efficiency > 80 && spendPerDay > 150;
}).slice(0, 10);

console.log('\nHigh efficiency (>80 mi/day) + High spending (>$150/day):');
highEfficiencyHighSpending.forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    
    let perDayRate = 100;
    if (days >= 14) perDayRate = 60;
    else if (days >= 12) perDayRate = 70;
    else if (days >= 10) perDayRate = 80;
    else if (days >= 8) perDayRate = 90;
    
    const base = days * perDayRate + miles * 0.58;
    const receiptFactor = (expected - base) / receipts;
    const efficiency = miles / days;
    const spendPerDay = receipts / days;
    
    console.log(`${days}d, ${miles}mi (${efficiency.toFixed(1)}/d), $${receipts} ($${spendPerDay.toFixed(2)}/d) → $${expected} (factor: ${receiptFactor.toFixed(2)})`);
});

// Cases with very high receipts relative to base amount
console.log('\nCases where receipts > base amount:');
const highReceiptCases = publicCases.filter(c => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = c.input;
    
    let perDayRate = 100;
    if (days >= 14) perDayRate = 60;
    else if (days >= 12) perDayRate = 70;
    else if (days >= 10) perDayRate = 80;
    else if (days >= 8) perDayRate = 90;
    
    const base = days * perDayRate + miles * 0.58;
    return receipts > base && receipts > 1000;
}).slice(0, 10);

highReceiptCases.forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    
    let perDayRate = 100;
    if (days >= 14) perDayRate = 60;
    else if (days >= 12) perDayRate = 70;
    else if (days >= 10) perDayRate = 80;
    else if (days >= 8) perDayRate = 90;
    
    const base = days * perDayRate + miles * 0.58;
    const receiptFactor = (expected - base) / receipts;
    const receiptToBaseRatio = receipts / base;
    
    console.log(`${days}d, ${miles}mi, $${receipts} → $${expected} (R/B ratio: ${receiptToBaseRatio.toFixed(2)}, factor: ${receiptFactor.toFixed(2)})`);
});

// Look at the distribution of negative factors by different characteristics
console.log('\n\nAnalyzing when negative factors occur...');

const allCases = publicCases.map(c => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = c.input;
    const expected = c.expected_output;
    
    let perDayRate = 100;
    if (days >= 14) perDayRate = 60;
    else if (days >= 12) perDayRate = 70;
    else if (days >= 10) perDayRate = 80;
    else if (days >= 8) perDayRate = 90;
    
    const base = days * perDayRate + miles * 0.58;
    const receiptFactor = receipts > 0 ? (expected - base) / receipts : 0;
    
    return {
        ...c,
        base,
        receiptFactor,
        efficiency: miles / days,
        spendPerDay: receipts / days,
        receiptToBaseRatio: receipts / base
    };
});

// Find thresholds for negative factors
const negativeCases = allCases.filter(c => c.receiptFactor < 0);
console.log(`\nFound ${negativeCases.length} cases with negative factors`);

// Analyze when the most negative factors occur
const extremeNegative = negativeCases.filter(c => c.receiptFactor < -0.2).slice(0, 5);
console.log('\nMost extreme negative cases (factor < -0.2):');
extremeNegative.forEach(c => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = c.input;
    const expected = c.expected_output;
    
    console.log(`${days}d, ${miles}mi, $${receipts} → $${expected}`);
    console.log(`  Factor: ${c.receiptFactor.toFixed(3)}, Efficiency: ${c.efficiency.toFixed(1)}, Spend/day: ${c.spendPerDay.toFixed(2)}, R/B: ${c.receiptToBaseRatio.toFixed(2)}`);
});

// Try to find the exact conditions
console.log('\nLooking for exact conditions that trigger negative factors...');

// Check if it's about receipt to base ratio thresholds
const receiptToBaseThresholds = [0.5, 1.0, 1.5, 2.0, 2.5, 3.0];
receiptToBaseThresholds.forEach(threshold => {
    const aboveThreshold = allCases.filter(c => c.receiptToBaseRatio > threshold);
    const negativeAboveThreshold = aboveThreshold.filter(c => c.receiptFactor < 0);
    const avgFactor = negativeAboveThreshold.length > 0 ? 
        negativeAboveThreshold.reduce((sum, c) => sum + c.receiptFactor, 0) / negativeAboveThreshold.length : 0;
    
    console.log(`R/B > ${threshold}: ${negativeAboveThreshold.length}/${aboveThreshold.length} negative (${(negativeAboveThreshold.length/aboveThreshold.length*100).toFixed(1)}%), avg factor: ${avgFactor.toFixed(3)}`);
});