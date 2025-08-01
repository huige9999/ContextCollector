import * as vscode from 'vscode';

type CollectedContext = Map<string, string[]>;

// 将生成Markdown内容的逻辑提取为一个可复用的函数
function getFormattedContext(context: vscode.ExtensionContext): string | null {
    const storedContext = context.workspaceState.get<[string, string[]][]>('contextData', []);
    if (!storedContext || storedContext.length === 0) {
        vscode.window.showWarningMessage('No context collected yet.');
        return null;
    }

    const collectedContext: CollectedContext = new Map(storedContext);
    const files = Array.from(collectedContext.keys()).sort();

    const fileStructure = '```\n' + files.join('\n') + '\n```';

    let fileContent = '';
    for (const path of files) {
        const snippets = collectedContext.get(path)!;
        fileContent += `--- \n\`${path}\`:\n\n`;
        const formattedSnippets = snippets.map(s => "```\n" + s + "\n```").join('\n\n');
        fileContent += `${formattedSnippets}\n\n`;
    }

    return `# File Structure\n${fileStructure}\n\n# File Content\n${fileContent}`;
}

// --------------------------------------------------------------------------------

export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "contextcollector" is now active!');

    // 1. 创建状态栏项
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'context-collector.showOptions';
    context.subscriptions.push(statusBarItem);

    // 2. 创建一个更新状态栏的辅助函数
    function updateStatusBar() {
        const storedContext = context.workspaceState.get<[string, string[]][]>('contextData', []);
        if (storedContext && storedContext.length > 0) {
            const fileCount = new Map(storedContext).size;
            statusBarItem.text = `$(clippy) Context: ${fileCount} files`;
            statusBarItem.tooltip = "Manage AI Context";
            statusBarItem.show();
        } else {
            statusBarItem.hide();
        }
    }

    // 3. 注册所有命令

    // -- 添加选中 --
    const addSelectionCommand = vscode.commands.registerCommand('context-collector.addSelection', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }

        const selectedText = editor.document.getText(editor.selection);
        if (!selectedText) { return; }

        const filePath = vscode.workspace.asRelativePath(editor.document.uri);
        const storedContext = context.workspaceState.get<[string, string[]][]>('contextData', []);
        const collectedContext: CollectedContext = new Map(storedContext);

        if (collectedContext.has(filePath)) {
            collectedContext.get(filePath)!.push(selectedText);
        } else {
            collectedContext.set(filePath, [selectedText]);
        }
        context.workspaceState.update('contextData', Array.from(collectedContext.entries()));
        
        updateStatusBar(); // 更新状态栏
        vscode.window.showInformationMessage(`Added to context!`);
    });

    // -- 清空上下文 --
    const clearCommand = vscode.commands.registerCommand('context-collector.clearContext', () => {
        context.workspaceState.update('contextData', undefined);
        updateStatusBar(); // 更新状态栏
        vscode.window.showInformationMessage('Context cleared!');
    });

    // -- 预览上下文 --
    const previewCommand = vscode.commands.registerCommand('context-collector.previewContext', async () => {
        const content = getFormattedContext(context);
        if (content === null) { return; }
        
        const doc = await vscode.workspace.openTextDocument({ content: content, language: 'markdown' });
        await vscode.window.showTextDocument(doc, { preview: true });
    });

    // -- 生成文件 --
    const generateFileCommand = vscode.commands.registerCommand('context-collector.generateFile', async () => {
        const content = getFormattedContext(context);
        if (content === null) { return; }

        const root = vscode.workspace.workspaceFolders?.[0];
        if (!root) {
            vscode.window.showErrorMessage('No workspace open.');
            return;
        }
        const targetPath = vscode.Uri.joinPath(root.uri, 'tempFile.md');
        
        await vscode.workspace.fs.writeFile(targetPath, Buffer.from(content, 'utf8'));

        const doc = await vscode.workspace.openTextDocument(targetPath);
        await vscode.window.showTextDocument(doc);
    });

    // -- 显示操作选项 (QuickPick) --
    const showOptionsCommand = vscode.commands.registerCommand('context-collector.showOptions', () => {
        const options = [
            { label: '$(file-code) Generate Context File', description: 'Create tempFile.md in root', command: 'context-collector.generateFile' },
            { label: '$(eye) Preview Context', description: 'Show context in a new tab', command: 'context-collector.previewContext' },
            { label: '$(trash) Clear Context', description: 'Empty the collected context', command: 'context-collector.clearContext' }
        ];
        vscode.window.showQuickPick(options).then(selection => {
            if (selection) {
                vscode.commands.executeCommand(selection.command);
            }
        });
    });

    // 4. 将所有命令添加到订阅中，并初始化状态栏
    context.subscriptions.push(addSelectionCommand, clearCommand, previewCommand, generateFileCommand, showOptionsCommand);
    updateStatusBar(); // 插件激活时，立即更新一次状态栏
}

export function deactivate() {}