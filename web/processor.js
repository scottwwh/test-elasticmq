const ProcessorApp = require('./src/ProcessorApp');
const config = require('./src/config');

try {
    const processor = new ProcessorApp(config);
} catch (err) {
    console.log('Could not initialize ProcessorApp:', err);
}