#!/usr/bin/env node

function calculateReimbursement(tripDays, miles, receipts) {
    const days = parseInt(tripDays);
    const milesTraveled = parseFloat(miles);
    const receiptAmount = parseFloat(receipts);
    
    // Base per diem and mileage
    let reimbursement = days * 100 + milesTraveled * 0.58;
    
    // Receipt contribution with complex logic
    let receiptContribution = 0;
    
    // Spending per day affects receipt treatment
    const spendingPerDay = receiptAmount / days;
    
    if (receiptAmount <= 50) {
        // Very small receipts get poor treatment
        receiptContribution = receiptAmount * 0.1;
    } else if (spendingPerDay <= 100) {
        // Reasonable daily spending gets good treatment
        receiptContribution = receiptAmount * 0.7;
    } else if (spendingPerDay <= 200) {
        // Higher daily spending gets reduced treatment
        receiptContribution = receiptAmount * 0.4;
    } else {
        // Very high daily spending gets heavily penalized
        receiptContribution = receiptAmount * 0.1;
    }
    
    // Long trip penalty for high spending (vacation penalty)
    if (days >= 10 && spendingPerDay > 150) {
        receiptContribution *= 0.3; // Heavy penalty
    } else if (days >= 7 && spendingPerDay > 120) {
        receiptContribution *= 0.6; // Moderate penalty
    }
    
    reimbursement += receiptContribution;
    
    // Trip length bonuses/penalties
    if (days === 5) {
        reimbursement += 25; // Sweet spot bonus
    } else if (days >= 12) {
        reimbursement -= 50; // Long trip penalty
    } else if (days >= 8) {
        reimbursement -= 20; // Medium trip penalty
    }
    
    // Efficiency considerations
    const milesPerDay = milesTraveled / days;
    if (milesPerDay >= 100 && milesPerDay <= 200) {
        reimbursement += 15; // Good efficiency bonus
    }
    
    // Small pseudo-random adjustment for variation
    const hash = (days * 7 + Math.floor(milesTraveled) * 11 + Math.floor(receiptAmount * 100) * 13) % 50;
    reimbursement += (hash - 25) * 0.8;
    
    // Ensure reasonable minimum
    if (reimbursement < days * 50) {
        reimbursement = days * 50;
    }
    
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