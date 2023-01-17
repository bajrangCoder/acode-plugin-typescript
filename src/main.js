import plugin from '../plugin.json';
const ts = require('typescript');

const loader = acode.require("loader");

class TypeScriptCompiler {
    
    async init() {
        editorManager.on('save-file', this.compile.bind(this));
    }
    
    async compile(file){
        const {location, name, session } = file;
        if (!location || !/\.(ts)$/.test(name)) return;
        if(/\.d\.ts$/.test(name)) return;
        
        window.toast("Starts compilation...",4000)
        const config = {
          strict: true,
          noEmitOnError: true,
          target: "esnext",
          module: "commonjs",
          useCaseSensitiveFileNames: true,
        };
        try {
            loader.create("Compiling","wait...");
            const program = ts.createProgram([location+name], config);
            const emitResult = program.emit();
            const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
            let errorLogs;
            allDiagnostics.forEach((diagnostic) => {
                if (diagnostic.file) {
                    const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
                    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
                    errorLogs += `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}\n`;
                } else {
                    errorLogs += ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
                }
            });
            if (emitResult.emitSkipped) {
                loader.destroy();
                window.toast(`Compilation failed.`,3000);
                window.alert(errorLogs)
            } else {
                loader.destroy();
                window.toast(`TypeScript compilation completed successfully.`,3000);
            }
        } catch (e) {
            loader.destroy();
            window.toast(e,4000)
        }
        
    }

    async destroy() {
        editorManager.off('save-file', this.compile);
    }
}

if (window.acode) {
    const acodePlugin = new TypeScriptCompiler();
    acode.setPluginInit(plugin.id, (baseUrl, $page, {
        cacheFileUrl, cacheFile
    }) => {
        if (!baseUrl.endsWith('/')) {
            baseUrl += '/';
        }
        acodePlugin.baseUrl = baseUrl;
        acodePlugin.init($page, cacheFile, cacheFileUrl);
    });
    acode.setPluginUnmount(plugin.id, () => {
        acodePlugin.destroy();
    });
}