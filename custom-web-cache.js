const { WebCache } = require('whatsapp-web.js/src/webCache/WebCache');
const path = require('path');
const fs = require('fs');

class CustomWebCache extends WebCache {
    constructor(options = {}) {
        super();
        this.path = options.path || './.wwebjs_cache/';
        this.strict = options.strict || false;
        this.defaultVersion = '2.3000.0';
    }

    async resolve(version) {
        const filePath = path.join(this.path, `${version}.html`);
        
        try {
            return fs.readFileSync(filePath, 'utf-8');
        } catch (err) {
            if (this.strict) {
                throw new Error(`Couldn't load version ${version} from the cache`);
            }
            return null;
        }
    }

    async persist(indexHtml) {
        try {
            // Coba ekstrak versi dari HTML
            const match = indexHtml.match(/manifest-([\d\\.]+)\.json/);
            const version = match ? match[1] : this.defaultVersion;
            
            // Buat direktori cache jika belum ada
            fs.mkdirSync(this.path, { recursive: true });
            
            // Simpan HTML ke file
            const filePath = path.join(this.path, `${version}.html`);
            fs.writeFileSync(filePath, indexHtml);
            console.log(`Successfully cached version ${version}`);
            
            return version;
        } catch (err) {
            console.error('Error persisting cache:', err);
            return this.defaultVersion;
        }
    }
}

module.exports = CustomWebCache;
