#!/usr/bin/env node

const fs = require('fs');

// Read the public test cases
const publicCases = JSON.parse(fs.readFileSync('public_cases.json', 'utf8'));

console.log('Analyzing high-error patterns...\n');

// Look at cases with similar characteristics to the error cases
const longTrips = publicCases.filter(c => c.input.trip_duration_days >= 10);
const highReceipts = publicCases.filter(c => c.input.total_receipts_amount >= 2000);

console.log('Long trips (10+ days):');
longTrips.slice(0, 10).forEach((testCase, i) => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    
    const perDayRate = expected / days;
    const afterDays = expected - (days * 100);
    const milesContrib = miles * 0.58;
    const remaining = afterDays - milesContrib;
    const receiptFactor = receipts > 0 ? remaining / receipts : 0;
    
    console.log(`${days} days, ${miles} miles, $${receipts} receipts → $${expected}`);
    console.log(`  Per day: $${perDayRate.toFixed(2)}, Receipt factor: ${receiptFactor.toFixed(2)}`);
});

console.log('\nHigh receipt cases ($1000+):');
const highReceiptCases = publicCases.filter(c => c.input.total_receipts_amount >= 1000);
highReceiptCases.slice(0, 10).forEach((testCase, i) => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    
    const receiptRatio = expected / receipts;
    const withoutReceipts = expected - receipts;
    const baseRate = withoutReceipts / days;
    
    console.log(`${days} days, ${miles} miles, $${receipts} receipts → $${expected}`);
    console.log(`  Receipt ratio: ${receiptRatio.toFixed(2)}, Base rate: $${baseRate.toFixed(2)}/day`);
});

console.log('\nAnalyzing receipt diminishing returns...');
// Group by receipt amount ranges
const receiptRanges = [
    { min: 0, max: 50, cases: [] },
    { min: 50, max: 200, cases: [] },
    { min: 200, max: 500, cases: [] },
    { min: 500, max: 1000, cases: [] },
    { min: 1000, max: 2000, cases: [] },
    { min: 2000, max: 5000, cases: [] }
];

publicCases.forEach(testCase => {
    const receipts = testCase.input.total_receipts_amount;
    for (let range of receiptRanges) {
        if (receipts >= range.min && receipts < range.max) {
            range.cases.push(testCase);
            break;
        }
    }
});

receiptRanges.forEach(range => {
    if (range.cases.length > 0) {
        const avgReceiptFactor = range.cases.reduce((sum, c) => {
            const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = c.input;
            const expected = c.expected_output;
            const base = days * 100 + miles * 0.58;
            const factor = receipts > 0 ? (expected - base) / receipts : 0;
            return sum + factor;
        }, 0) / range.cases.length;
        
        console.log(`$${range.min}-${range.max}: ${range.cases.length} cases, avg factor: ${avgReceiptFactor.toFixed(2)}`);
    }
});