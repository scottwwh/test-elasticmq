const ProcessorApp = require('./ProcessorApp');
const config = require('./config');

try {
    const processor = new ProcessorApp(config);
} catch (err) {
    console.log('Could not initialize ProcessorApp:', err);
}