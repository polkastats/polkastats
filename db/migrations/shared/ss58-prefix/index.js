const keyring = require('@polkadot/keyring');

const SS58_PREFIX_NEW = 54;
const SS58_PREFIX_OLD = 42;

const executeDbRunSqlAsPromise = (db, sqlQuery) => {
    return new Promise((resolve, reject) => {
        db.runSql(sqlQuery, (error, result) => {
            if (error) {
                console.log('Error', error);
                console.log('sqlQuery', sqlQuery);
                reject(error);
            }
            resolve(result);
        })
    });
}

class Logger {
    constructor(tableName) {
        this.tableName = tableName;
        this.totalRows = 0;
        this.currentRow = 0;
        this.migratedPercent = 0;
        console.log(`Migrating ${this.tableName}`);
    }

    setTotalRows(totalRows) {
        this.totalRows = totalRows;
        console.log(`Total rows: ${totalRows} for table ${this.tableName}`);
    }

    log() {
        this.currentRow++;
        const { currentRow, totalRows, tableName } = this;

        if (currentRow === totalRows) {
            console.log(`✅ Done for ${tableName} table`);
        } else {
            const migratedPercent = Math.trunc(100 * currentRow / totalRows);

            if (migratedPercent % 20 === 0 && migratedPercent > this.migratedPercent) {
                this.migratedPercent = migratedPercent;
                console.log(`⏳ Migrated ${migratedPercent}% for ${tableName} table`);
            }
        }
    }
}

const decodeAddress = (address, ss58) => {
    if (address.startsWith('0x')) {
        console.log('Address starts with 0x', address);
        return address;
    } else {
        return keyring.encodeAddress(
            keyring.decodeAddress(address),
            ss58);
    }
};

module.exports = {
    SS58_PREFIX_NEW,
    SS58_PREFIX_OLD,
    executeDbRunSqlAsPromise,
    Logger,
    decodeAddress,
};
