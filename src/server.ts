import {
    createConnection,
    Diagnostic,
    DiagnosticSeverity,
    ProposedFeatures,
    InitializeParams,
    InitializeResult,
    TextDocumentSyncKind,
    CodeAction,
    integer,
} from "vscode-languageserver/node";
// import {TextDocument} from "vscode-languageserver-textdocument";
import axios from "axios";
import {Location, Range, SelectionRange} from "coc.nvim";

interface Software {
    name: string;
    version: string;
    buildDate: string;
    apiVersion: number;
    status: string;
    premium: boolean;
}

interface Language {
    name: string;
    code: string;
    detectedLanguage: {
        name: string;
        code: string;
    };
}

interface Match {
    message: string;
    shortMessage: string;
    offset: integer;
    length: integer;
    replacements: [
        {
            value: string;
        },
    ];
    context: {
        text: string;
        offset: integer;
        length: integer;
    };
    sentence: string;
    rule: {
        id: string;
        subId: string;
        description: string;
        urls: [
            {
                value: string;
            },
        ];
        issueType: string;
        category: {
            id: string;
            name: string;
        };
    };
}

interface LanguageToolResponse {
    software: Software;
    language: Language;
    matches: Match[];
}

export class Found {
    constructor(public start: number, public end: number, public text: string) {}
}

let connection = createConnection(ProposedFeatures.all);

connection.onInitialize((_params: InitializeParams) => {
    const result: InitializeResult = {
        serverInfo: {
            name: "languagetool",
        },
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            // Tell the client that this server supports code completion.
            completionProvider: {
                resolveProvider: false,
            },
            codeActionProvider: {
                resolveProvider: true,
            },
        },
    };

    return result;
});

connection.onInitialized(() => {});

connection.onDidChangeConfiguration((_change) => {});

connection.onDidChangeWatchedFiles((_change) => {});

connection.onCodeAction((param): CodeAction[] => {
    /*return [
        {
            title: "Add to dictionary",
            kind: "add",
            diagnostics: param.context.diagnostics,
            data: param.range,
        },
    ];*/

    return [];
});

connection.onCodeActionResolve((action): CodeAction => {
    /*
    const server = "http://localhost:8081";
    const endpoint = "/v2/words/add";
    const language = "en-US";
    console.log("FROM RESOLVE")
    console.log(action)
    let diagnostics = action.diagnostics;
    if (diagnostics == undefined) {
        return action;
    }
    switch (action.data) {
        case "add":
            let url = server + endpoint + "?language=" + language + "&word=" + diagnostics[0].data;
            axios.post(url);
            break
    }
    */

    action.title == "Test blablabla";

    return action;
});

connection.onRequest("languagetool.check.line", async (params) => {});

connection.onRequest("languagetool.check.selection", async (params) => {
    const uri: string = params.uri;
    const range: Range = params.range;
    let selected: string = params.selected;

    // NOTICE: When multilines are selected, to avoid false positive on LanguageTool, we turn all the selection into oneliner.
    // selected.replace('\n', " ");

    // TODO: replace comments' tokens too.

    const response = await axios.get(
        "http://0.0.0.0:8081/v2/check?language=en-US&text=" + selected,
    );
    const data: LanguageToolResponse = response.data;

    let diagnostics: Diagnostic[] = [];
    for (const match of data.matches) {
        const diagnostic: Diagnostic = {
            message: match.message,
            code: match.rule.id,
            source: match.rule.issueType,
            severity: DiagnosticSeverity.Hint,
            data: match.context.text.slice(
                match.context.offset,
                match.context.offset + match.context.length,
            ),
            range: {
                start: {
                    line: range.start.line,
                    character: range.start.character + match.offset,
                },
                end: {
                    line: range.start.line,
                    character: range.start.character + match.offset + match.length,
                },
            },
        };

        diagnostics.push(diagnostic);
    }

    connection.sendDiagnostics({
        uri: uri,
        diagnostics: diagnostics,
    });
});

connection.onRequest("languagetool.check.document", async (params) => {});

connection.onRequest("languagetool.check.clear", async (params) => {});

// let document: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
//
// document.onDidOpen((_change: TextDocumentChangeEvent<TextDocument>) => {});
// 
// document.onDidChangeContent(
//     async (change: TextDocumentChangeEvent<TextDocument>) => {
//         // const text = change.document.getText();
// 
//         // TODO: create better regex to check strings and comments.
//         // It works, but it's not perfect.
// 
//         // for // and /* */ comments.
//         // const regexComment = /(\/\/[^\n]*|\/\*.*\*\/)/g;
//         // for "", '' or ``.
//         // const regexString = /(?<="|'|`)(.*?)(?="|'|`)/g;
// 
//         // combine all regexes.
//         /*const regex = new RegExp(
//       `${regexComment.source}|${regexString.source}`,
//       "g");*/
// 
//         /*let matched = text.match(new RegExp(/(?<="|'|`)(.*?)(?="|'|`)/g));
//         if (matched == null) {
//             return;
//         }
// 
//         let founds = matched?.map((value: any) => {
//             const start = text.indexOf(value);
//             const end = start + value.length;
// 
//             return new Found(start, end, value);
//         });
// 
//         const server = "http://0.0.0.0:8081";
//         const endpoint = "/v2/check";
//         const language = "en-US";
// 
//         let diagnostics: Diagnostic[] = [];
// 
//         founds?.forEach(async (found: any) => {
//             let url =
//                 server + endpoint + "?language=" + language + "&text=" + found.text;
// 
//             let response = await axios.get(url);
// 
//             let matches = response.data.matches;
//             matches?.forEach((match: any) => {
//                 let diagnostic: Diagnostic = {
//                     severity: DiagnosticSeverity.Information,
//                     range: {
//                         start: change.document.positionAt(found.start + match.offset),
//                         end: change.document.positionAt(
//                             found.start + match.offset + match.length,
//                         ),
//                     },
//                     message: match.message,
//                     source: match.rule.issueType,
//                     code: match.rule.id,
//                     data: match.context.text.slice(
//                         match.context.offset,
//                         match.context.length,
//                     ),
//                 };
// 
//                 diagnostics.push(diagnostic);
//             });
// 
//             await connection.sendDiagnostics({
//                 uri: change.document.uri,
//                 diagnostics,
//             });
//         });*/
//     },
// );
// 
// document.onDidClose((_event) => {});
// 
// document.listen(connection);

connection.listen();
