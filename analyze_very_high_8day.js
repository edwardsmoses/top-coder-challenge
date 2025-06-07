#!/usr/bin/env node

const fs = require('fs');

// Read the public test cases
const publicCases = JSON.parse(fs.readFileSync('public_cases.json', 'utf8'));

console.log('Analyzing 8-day trips with $2000+ receipts...\n');

// Look at 8-day trips with very high receipts
const eightDayVeryHighReceipt = publicCases.filter(c => 
    c.input.trip_duration_days === 8 && c.input.total_receipts_amount >= 2000
);

console.log(`Found ${eightDayVeryHighReceipt.length} 8-day trips with $2000+ receipts`);
console.log('Miles\tReceipts\tExpected\tSpend/Day\tReceipt Factor');

eightDayVeryHighReceipt.forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    
    const baseAmount = days * 90 + miles * 0.58; // 8-day rate
    const receiptFactor = receipts > 0 ? (expected - baseAmount) / receipts : 0;
    const spendPerDay = receipts / days;
    
    console.log(`${miles}\t${receipts.toFixed(2)}\t\t${expected}\t\t${spendPerDay.toFixed(2)}\t\t${receiptFactor.toFixed(2)}`);
});

// Also check other long trips with very high receipts
console.log('\n9+ day trips with $2000+ receipts:');
const longVeryHighReceipt = publicCases.filter(c => 
    c.input.trip_duration_days >= 9 && c.input.total_receipts_amount >= 2000
);

longVeryHighReceipt.slice(0, 10).forEach(testCase => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = testCase.input;
    const expected = testCase.expected_output;
    
    let baseRate = 90;
    if (days >= 14) baseRate = 60;
    else if (days >= 12) baseRate = 70;
    else if (days >= 10) baseRate = 80;
    
    const baseAmount = days * baseRate + miles * 0.58;
    const receiptFactor = receipts > 0 ? (expected - baseAmount) / receipts : 0;
    const spendPerDay = receipts / days;
    
    console.log(`${days} days, ${miles} miles, ${receipts.toFixed(2)} receipts → ${expected} (${spendPerDay.toFixed(2)}/day, factor: ${receiptFactor.toFixed(2)})`);
});

console.log('\nAnalyzing if there\'s a minimum receipt factor for very high amounts:');
const allVeryHighReceipts = publicCases.filter(c => c.input.total_receipts_amount >= 2000);
const factors = allVeryHighReceipts.map(c => {
    const { trip_duration_days: days, miles_traveled: miles, total_receipts_amount: receipts } = c.input;
    const expected = c.expected_output;
    
    let baseRate = 100;
    if (days >= 14) baseRate = 60;
    else if (days >= 12) baseRate = 70;
    else if (days >= 10) baseRate = 80;
    else if (days >= 8) baseRate = 90;
    
    const baseAmount = days * baseRate + miles * 0.58;
    return receipts > 0 ? (expected - baseAmount) / receipts : 0;
});

factors.sort((a, b) => a - b);
console.log(`Minimum factor: ${factors[0].toFixed(2)}`);
console.log(`Maximum factor: ${factors[factors.length - 1].toFixed(2)}`);
console.log(`Average factor: ${(factors.reduce((a, b) => a + b, 0) / factors.length).toFixed(2)}`);
console.log(`10th percentile: ${factors[Math.floor(factors.length * 0.1)].toFixed(2)}`);
console.log(`90th percentile: ${factors[Math.floor(factors.length * 0.9)].toFixed(2)}`);