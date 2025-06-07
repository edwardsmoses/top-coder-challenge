#!/usr/bin/env node

const fs = require('fs');

// Read the public test cases
const publicCases = JSON.parse(fs.readFileSync('public_cases.json', 'utf8'));

console.log('Analyzing 8+ day trips with high receipts...\n');

// Look at 8+ day trips with high receipts
const longHighReceiptTrips = publicCases.filter(c => {
    return c.input.trip_duration_days >= 8 && c.input.total_receipts_amount > 1000;
});

console.log(`Found ${longHighReceiptTrips.length} long trips (8+ days) with high receipts (>$1000)`);
console.log('Days\tMiles\tReceipts\tExpected\tSpend/Day\tExpected/Receipts');

longHighReceiptTrips.slice(0, 20).forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    const spendPerDay = receipts / days;
    const expectedToReceiptRatio = expected / receipts;
    
    console.log(`${days}\t${miles}\t${receipts.toFixed(2)}\t\t${expected}\t\t${spendPerDay.toFixed(2)}\t\t${expectedToReceiptRatio.toFixed(2)}`);
});

// Look specifically at 8-day trips
console.log('\n8-day trips with high receipts:');
const eightDayHighReceipt = publicCases.filter(c => 
    c.input.trip_duration_days === 8 && c.input.total_receipts_amount > 1000
);

eightDayHighReceipt.forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    
    const baseAmount = days * 90 + miles * 0.58; // Using 8-day rate
    const receiptFactor = receipts > 0 ? (expected - baseAmount) / receipts : 0;
    
    console.log(`Miles=${miles}, Receipts=${receipts.toFixed(2)}, Expected=${expected}`);
    console.log(`  Base=${baseAmount.toFixed(2)}, Need=${(expected - baseAmount).toFixed(2)}, Factor=${receiptFactor.toFixed(2)}`);
});

// Check if very high receipts on long trips get negative treatment
console.log('\nAnalyzing receipt factors for long trips by spending per day:');
const spendingRanges = [
    { min: 100, max: 150, cases: [] },
    { min: 150, max: 200, cases: [] },
    { min: 200, max: 300, cases: [] },
    { min: 300, max: 500, cases: [] }
];

longHighReceiptTrips.forEach(testCase => {
    const spendPerDay = testCase.input.total_receipts_amount / testCase.input.trip_duration_days;
    for (let range of spendingRanges) {
        if (spendPerDay >= range.min && spendPerDay < range.max) {
            range.cases.push(testCase);
            break;
        }
    }
});

spendingRanges.forEach(range => {
    if (range.cases.length > 0) {
        const avgReceiptFactor = range.cases.reduce((sum, c) => {
            const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = c.input;
            const expected = c.expected_output;
            let baseRate = 100;
            if (days >= 14) baseRate = 60;
            else if (days >= 12) baseRate = 70;
            else if (days >= 10) baseRate = 80;
            else if (days >= 8) baseRate = 90;
            
            const base = days * baseRate + miles * 0.58;
            const factor = receipts > 0 ? (expected - base) / receipts : 0;
            return sum + factor;
        }, 0) / range.cases.length;
        
        console.log(`$${range.min}-${range.max}/day: ${range.cases.length} cases, avg factor: ${avgReceiptFactor.toFixed(2)}`);
    }
});