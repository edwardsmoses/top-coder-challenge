#!/usr/bin/env node

const fs = require('fs');

// Read the public test cases
const publicCases = JSON.parse(fs.readFileSync('public_cases.json', 'utf8'));

console.log('Analyzing first 10 cases:');
console.log('Days\tMiles\tReceipts\tExpected\tPer-Day\tPer-Mile\tReceipt-Factor');

for (let i = 0; i < Math.min(10, publicCases.length); i++) {
    const testCase = publicCases[i];
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    
    // Calculate what the per-day rate would be if we assume simple addition
    const remainingAfterReceipts = expected - receipts;
    const perDay = remainingAfterReceipts / days;
    const perMile = miles > 0 ? remainingAfterReceipts / miles : 0;
    const receiptFactor = receipts > 0 ? expected / receipts : 0;
    
    console.log(`${days}\t${miles}\t${receipts}\t\t${expected}\t\t${perDay.toFixed(2)}\t${perMile.toFixed(2)}\t\t${receiptFactor.toFixed(2)}`);
}

// Try to find patterns
console.log('\nTrying different formulas:');

for (let i = 0; i < Math.min(5, publicCases.length); i++) {
    const testCase = publicCases[i];
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    
    // Test various formulas
    const formula1 = days * 100 + miles * 0.5 + receipts;
    const formula2 = days * 120 + miles * 0.6 + receipts;
    const formula3 = days * 110 + miles * 1.5 + receipts;
    const formula4 = days * 100 + miles * 2 + receipts * 10;
    
    console.log(`Case ${i + 1}: Expected=${expected}, F1=${formula1.toFixed(2)}, F2=${formula2.toFixed(2)}, F3=${formula3.toFixed(2)}, F4=${formula4.toFixed(2)}`);
}