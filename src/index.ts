import {workspace, commands, services} from "coc.nvim";
import {
    ExtensionContext,
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    Document,
} from "coc.nvim";
import * as path from "path";

const serverOptions: ServerOptions = {
    module: path.join(__dirname, "server.js"),
    args: [],
    options: {
        cwd: __dirname,
    },
};

const clientOptions: LanguageClientOptions = {
    /*documentSelector: [
        "gitcommit",
        "gitconfig",
        "gitattributes",
        "gitignore",
        "git-rebase-todo",
        "git-rebase",
        "typescript"
    ],*/
    documentSelector: [],
    synchronize: {
        configurationSection: "coc-languagetool",
    },
};

const languageClient = new LanguageClient(
    "languagetool",
    "LanguageTool LSP",
    serverOptions,
    clientOptions,
);

export async function activate(context: ExtensionContext): Promise<void> {
    const subscriptions = context.subscriptions;

    subscriptions.push(services.registLanguageClient(languageClient));

    subscriptions.push(
        commands.registerCommand("languagetool.enable", async () => {
            workspace.getConfiguration().update("languagetool.enable", true, true);
        }),
        commands.registerCommand("languagetool.disable", async () => {
            workspace.getConfiguration().update("languagetool.enable", false, true);
        }),
        commands.registerCommand("languagetool.toggle", async () => {
            const isEnabled = workspace
                .getConfiguration()
                .get<boolean>("languagetool.enable", true);
            workspace
                .getConfiguration()
                .update("languagetool.enable", !isEnabled, true);
        }),
        commands.registerCommand("languagetool.version", async () => {}),
        commands.registerCommand("languagetool.check.line", async () => {}),
        commands.registerCommand("languagetool.check.selection", async () => {
            const doc: Document = await workspace.document;
            workspace.getSelectedRange("v", doc).then((range) => {
                if (!range) {
                    return;
                }

                languageClient.sendRequest("languagetool.check.selection", {
                    uri: doc.textDocument.uri,
                    range: {
                        start: {
                            line: range.start.line,
                            character: range.start.character,
                        },
                        end: {
                            line: range.end.line,
                            character: range.end.character,
                        },
                    },
                    selected: doc.textDocument.getText(range),
                });
            });
        }),
        commands.registerCommand("languagetool.clear", async () => {
            const doc = await workspace.document;
            languageClient.sendNotification("languagetool.clear", {
                textDocument: {
                    uri: doc.uri,
                },
            });
        }),
    );

    if (languageClient.needsStart()) {
        languageClient.start();
    }
}

export function deactivate(): void {
    if (languageClient.needsStop()) {
        languageClient.stop()
    }
}
