#!/usr/bin/env node

const fs = require('fs');

// Read the public test cases
const publicCases = JSON.parse(fs.readFileSync('public_cases.json', 'utf8'));

console.log('Analyzing specific high-error cases...\n');

// Look at the specific error cases mentioned
const errorCases = [
    { days: 8, miles: 795, receipts: 1645.99, expected: 644.69 },
    { days: 11, miles: 740, receipts: 1171.99, expected: 902.09 },
    { days: 1, miles: 1082, receipts: 1809.49, expected: 446.94 },
    { days: 8, miles: 482, receipts: 1411.49, expected: 631.81 },
    { days: 5, miles: 516, receipts: 1878.49, expected: 669.85 }
];

console.log('Error cases analysis:');
console.log('Days\tMiles\tReceipts\tExpected\tSpend/Day\tExpected/Receipts\tBase\tReceipt Factor');

errorCases.forEach(testCase => {
    const { days, miles, receipts, expected } = testCase;
    const spendPerDay = receipts / days;
    const expectedToReceiptRatio = expected / receipts;
    
    // Calculate base using current logic
    let perDayRate = 100;
    if (days >= 14) perDayRate = 60;
    else if (days >= 12) perDayRate = 70;
    else if (days >= 10) perDayRate = 80;
    else if (days >= 8) perDayRate = 90;
    
    const base = days * perDayRate + miles * 0.58;
    const receiptFactor = receipts > 0 ? (expected - base) / receipts : 0;
    
    console.log(`${days}\t${miles}\t${receipts.toFixed(2)}\t\t${expected}\t\t${spendPerDay.toFixed(2)}\t\t${expectedToReceiptRatio.toFixed(2)}\t\t\t${base.toFixed(2)}\t${receiptFactor.toFixed(2)}`);
});

// Look for similar patterns in the full dataset
console.log('\nSearching for cases where expected/receipts ratio is very low...');

const lowRatioCases = publicCases.filter(c => {
    const ratio = c.expected_output / c.input.total_receipts_amount;
    return ratio < 0.5 && c.input.total_receipts_amount > 1000;
}).slice(0, 15);

console.log('Cases with very low expected/receipts ratio (<0.5):');
lowRatioCases.forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    const ratio = expected / receipts;
    const spendPerDay = receipts / days;
    
    console.log(`${days} days, ${miles} miles, $${receipts.toFixed(2)} → $${expected} (ratio: ${ratio.toFixed(2)}, spend/day: ${spendPerDay.toFixed(2)})`);
});

// Look for very high mileage cases
console.log('\nHigh mileage cases (>800 miles):');
const highMileageCases = publicCases.filter(c => c.input.miles_traveled > 800).slice(0, 10);

highMileageCases.forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    const milesPerDay = miles / days;
    
    let perDayRate = 100;
    if (days >= 14) perDayRate = 60;
    else if (days >= 12) perDayRate = 70;
    else if (days >= 10) perDayRate = 80;
    else if (days >= 8) perDayRate = 90;
    
    const base = days * perDayRate + miles * 0.58;
    const receiptFactor = receipts > 0 ? (expected - base) / receipts : 0;
    
    console.log(`${days} days, ${miles} miles (${milesPerDay.toFixed(1)}/day), $${receipts} → $${expected} (factor: ${receiptFactor.toFixed(2)})`);
});

// Check if there are cases where receipts actually reduce the total
console.log('\nCases where receipt factor is negative:');
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
}).slice(0, 10);

negativeCases.forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    
    let perDayRate = 100;
    if (days >= 14) perDayRate = 60;
    else if (days >= 12) perDayRate = 70;
    else if (days >= 10) perDayRate = 80;
    else if (days >= 8) perDayRate = 90;
    
    const base = days * perDayRate + miles * 0.58;
    const receiptFactor = receipts > 0 ? (expected - base) / receipts : 0;
    
    console.log(`${days} days, ${miles} miles, $${receipts} → $${expected} (base: ${base.toFixed(2)}, factor: ${receiptFactor.toFixed(2)})`);
});