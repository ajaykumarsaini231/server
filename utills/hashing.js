const bcrypt = require('bcryptjs')
const crypto = require("crypto")

exports.doHash =  (value, saltValue) => {
    const result=  bcrypt.hash(value, saltValue);
    return result
};

exports.dohashValidation= (value, HashedValue)=>{
    const result = bcrypt.compare(value,HashedValue)
    return result
}

exports.hmacProcess = (value, key) => {
    return crypto.createHmac("sha256", key).update(value).digest("hex");
};

