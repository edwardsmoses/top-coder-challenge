#!/usr/bin/env node

function calculateReimbursement(tripDays, miles, receipts) {
    const days = parseInt(tripDays);
    const milesTraveled = parseFloat(miles);
    const receiptAmount = parseFloat(receipts);
    
    // Different per-day rates based on trip length
    let perDayRate = 100; // Default rate
    
    if (days >= 14) {
        perDayRate = 60; // Very long trips get heavily reduced rate
    } else if (days >= 12) {
        perDayRate = 70; // Long trips get reduced rate
    } else if (days >= 10) {
        perDayRate = 80; // Medium-long trips get slightly reduced rate
    } else if (days >= 8) {
        perDayRate = 90; // Slightly reduced for 8-9 day trips
    }
    
    // Base calculation
    let reimbursement = days * perDayRate + milesTraveled * 0.58;
    
    // Receipt handling with diminishing returns
    let receiptContribution = 0;
    const spendingPerDay = receiptAmount / days;
    
    if (receiptAmount <= 100) {
        receiptContribution = receiptAmount * 0.5;
    } else if (spendingPerDay <= 80) {
        // Reasonable spending gets good treatment
        receiptContribution = receiptAmount * 0.6;
    } else if (spendingPerDay <= 150) {
        // Higher spending gets reduced treatment
        receiptContribution = receiptAmount * 0.3;
    } else {
        // Very high spending gets minimal treatment
        receiptContribution = receiptAmount * 0.1;
    }
    
    // Additional penalty for very long trips with high spending
    if (days >= 12 && spendingPerDay > 100) {
        receiptContribution *= 0.5; // Heavy penalty
    }
    
    reimbursement += receiptContribution;
    
    // Small efficiency bonus
    const milesPerDay = milesTraveled / days;
    if (milesPerDay >= 50 && milesPerDay <= 150) {
        reimbursement += days * 5; // Small efficiency bonus
    }
    
    // Sweet spot bonus for 5-day trips
    if (days === 5) {
        reimbursement += 30;
    }
    
    // Small variance
    const hash = (days * 5 + Math.floor(milesTraveled) * 7 + Math.floor(receiptAmount * 100) * 3) % 30;
    reimbursement += (hash - 15) * 1.2;
    
    return Math.round(reimbursement * 100) / 100;
}

// Handle command line arguments
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length !== 3) {
        console.error('Usage: node calculate_reimbursement.js <trip_duration_days> <miles_traveled> <total_receipts_amount>');
        process.exit(1);
    }
    
    const [tripDays, miles, receipts] = args;
    const result = calculateReimbursement(tripDays, miles, receipts);
    
    console.log(result);
}

module.exports = { calculateReimbursement };