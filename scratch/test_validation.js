
const testValidation = (estimatedTime) => {
    const timeVal = parseFloat(estimatedTime);
    if (isNaN(timeVal) || timeVal <= 0) {
        return { valid: false, msg: 'Rejected: Estimated completion time must be a positive number.' };
    }
    return { valid: true, msg: 'Accepted' };
};

console.log("--- Testing Server-Side Validation Logic ---");
console.log("Input: '3 hours' ->", testValidation('3 hours'));
console.log("Input: 'bljkbl.' ->", testValidation('bljkbl.'));
console.log("Input: '0' ->", testValidation('0'));
console.log("Input: '1.5' ->", testValidation('1.5'));
console.log("Input: '-5' ->", testValidation('-5'));
console.log("Input: undefined ->", testValidation(undefined));
