#!/usr/bin/env node

const fs = require('fs');

// Read the public test cases
const publicCases = JSON.parse(fs.readFileSync('public_cases.json', 'utf8'));

console.log('Analyzing high-receipt cases...\n');

// Look at cases with high receipts relative to trip length
const highReceiptCases = publicCases.filter(c => {
    const spendingPerDay = c.input.total_receipts_amount / c.input.trip_duration_days;
    return spendingPerDay > 400; // Very high daily spending
});

console.log(`Found ${highReceiptCases.length} high-receipt cases (>$400/day)`);
console.log('Days\tMiles\tReceipts\tExpected\tSpend/Day\tReceipt Ratio');

highReceiptCases.slice(0, 15).forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    const spendPerDay = receipts / days;
    const receiptRatio = expected / receipts;
    
    console.log(`${days}\t${miles}\t${receipts.toFixed(2)}\t\t${expected}\t\t${spendPerDay.toFixed(2)}\t\t${receiptRatio.toFixed(2)}`);
});

// Look at 1-day high receipt cases specifically
console.log('\n1-day trips with high receipts:');
const oneDayHighReceipt = publicCases.filter(c => 
    c.input.trip_duration_days === 1 && c.input.total_receipts_amount > 1000
);

oneDayHighReceipt.slice(0, 10).forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    
    const baseAmount = days * 100 + miles * 0.58;
    const receiptFactor = (expected - baseAmount) / receipts;
    
    console.log(`Miles=${miles}, Receipts=${receipts.toFixed(2)}, Expected=${expected}`);
    console.log(`  Base=${baseAmount.toFixed(2)}, Need=${(expected - baseAmount).toFixed(2)}, Factor=${receiptFactor.toFixed(2)}`);
});

// Look at 3-day high receipt cases
console.log('\n3-day trips with high receipts:');
const threeDayHighReceipt = publicCases.filter(c => 
    c.input.trip_duration_days === 3 && c.input.total_receipts_amount > 1500
);

threeDayHighReceipt.slice(0, 10).forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    
    const baseAmount = days * 100 + miles * 0.58;
    const receiptFactor = (expected - baseAmount) / receipts;
    
    console.log(`Miles=${miles}, Receipts=${receipts.toFixed(2)}, Expected=${expected}`);
    console.log(`  Base=${baseAmount.toFixed(2)}, Need=${(expected - baseAmount).toFixed(2)}, Factor=${receiptFactor.toFixed(2)}`);
});

// Analyze the pattern for very high receipts
console.log('\nAnalyzing receipt factor by amount ranges:');
const receiptRanges = [
    { min: 1000, max: 1500, cases: [] },
    { min: 1500, max: 2000, cases: [] },
    { min: 2000, max: 3000, cases: [] }
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