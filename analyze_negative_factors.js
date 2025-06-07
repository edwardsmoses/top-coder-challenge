#!/usr/bin/env node

const fs = require('fs');

// Read the public test cases
const publicCases = JSON.parse(fs.readFileSync('public_cases.json', 'utf8'));

console.log('Analyzing negative receipt factor patterns...\n');

// Find all cases with negative receipt factors
const negativeCases = publicCases.filter(c => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = c.input;
    const expected = c.expected_output;
    
    let perDayRate = 100;
    if (days >= 14) perDayRate = 60;
    else if (days >= 12) perDayRate = 70;
    else if (days >= 10) perDayRate = 80;
    else if (days >= 8) perDayRate = 90;
    
    const base = days * perDayRate + miles * 0.58;
    const receiptFactor = receipts > 0 ? (expected - base) / receipts : 0;
    
    return receiptFactor < 0;
});

console.log(`Found ${negativeCases.length} cases with negative receipt factors`);

// Analyze patterns
const patternAnalysis = {
    byTripLength: {},
    bySpendingRange: {},
    byMilesPerDay: {}
};

negativeCases.forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const spendPerDay = receipts / days;
    const milesPerDay = miles / days;
    
    // By trip length
    patternAnalysis.byTripLength[days] = (patternAnalysis.byTripLength[days] || 0) + 1;
    
    // By spending per day
    let spendRange;
    if (spendPerDay < 10) spendRange = '0-10';
    else if (spendPerDay < 50) spendRange = '10-50';
    else if (spendPerDay < 100) spendRange = '50-100';
    else if (spendPerDay < 200) spendRange = '100-200';
    else if (spendPerDay < 500) spendRange = '200-500';
    else spendRange = '500+';
    
    patternAnalysis.bySpendingRange[spendRange] = (patternAnalysis.bySpendingRange[spendRange] || 0) + 1;
    
    // By miles per day
    let milesRange;
    if (milesPerDay < 50) milesRange = '0-50';
    else if (milesPerDay < 100) milesRange = '50-100';
    else if (milesPerDay < 200) milesRange = '100-200';
    else if (milesPerDay < 500) milesRange = '200-500';
    else milesRange = '500+';
    
    patternAnalysis.byMilesPerDay[milesRange] = (patternAnalysis.byMilesPerDay[milesRange] || 0) + 1;
});

console.log('\nNegative factor patterns:');
console.log('By trip length:', patternAnalysis.byTripLength);
console.log('By spending per day:', patternAnalysis.bySpendingRange);
console.log('By miles per day:', patternAnalysis.byMilesPerDay);

// Look at the most extreme negative cases
console.log('\nMost extreme negative cases:');
const sortedNegative = negativeCases.map(c => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = c.input;
    const expected = c.expected_output;
    
    let perDayRate = 100;
    if (days >= 14) perDayRate = 60;
    else if (days >= 12) perDayRate = 70;
    else if (days >= 10) perDayRate = 80;
    else if (days >= 8) perDayRate = 90;
    
    const base = days * perDayRate + miles * 0.58;
    const receiptFactor = receipts > 0 ? (expected - base) / receipts : 0;
    
    return { ...c, receiptFactor, base };
}).sort((a, b) => a.receiptFactor - b.receiptFactor);

sortedNegative.slice(0, 10).forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    const { receiptFactor, base } = testCase;
    
    console.log(`${days} days, ${miles} miles, $${receipts} → $${expected} (base: ${base.toFixed(2)}, factor: ${receiptFactor.toFixed(2)})`);
});

// Check what makes these cases special
console.log('\nAnalyzing what triggers negative factors...');

// Very small receipts seem to trigger negative factors
const smallReceiptNegative = negativeCases.filter(c => c.input.total_receipts_amount < 50);
console.log(`Small receipts (<$50) with negative factors: ${smallReceiptNegative.length}/${negativeCases.length}`);

// Very high miles per day might trigger it
const highMilesNegative = negativeCases.filter(c => {
    const milesPerDay = c.input.miles_traveled / c.input.trip_duration_days;
    return milesPerDay > 200;
});
console.log(`High miles/day (>200) with negative factors: ${highMilesNegative.length}/${negativeCases.length}`);

// Or certain combinations
console.log('\nSpecific pattern analysis:');
negativeCases.slice(0, 5).forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    const milesPerDay = miles / days;
    const spendPerDay = receipts / days;
    
    console.log(`${days}d, ${miles}mi (${milesPerDay.toFixed(1)}/d), $${receipts} (${spendPerDay.toFixed(2)}/d) → $${expected}`);
    
    // Check various ratios
    const receiptToMiles = receipts / miles;
    const receiptToDays = receipts / days;
    console.log(`  Ratios: receipt/miles=${receiptToMiles.toFixed(2)}, receipt/days=${receiptToDays.toFixed(2)}`);
});