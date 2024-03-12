import { PersistentStorage } from './PersistentStorage';

export const CURRENT_DATA_SCHEMA_VERSION = 1;

export class StorageMigration {
    static async migrate() {
        // Save current schema version
        return PersistentStorage.setDataSchemaVersion(CURRENT_DATA_SCHEMA_VERSION);
    }
}
