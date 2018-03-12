'use strict';

import * as vscode from 'vscode';
import IrcDocument from './ircDocument';
import IrcInstance from './ircInstance';

export default class Provider implements vscode.TextDocumentContentProvider {

	static scheme = 'irc';
	
	private _onDidChange = new vscode.EventEmitter<vscode.Uri>();
	private _documents = new Map<string, IrcDocument>();
	private _editorDecoration = vscode.window.createTextEditorDecorationType({ textDecoration: 'underline' });
	private _subscriptions: vscode.Disposable;

	constructor() {
		// Listen to the `closeTextDocument`-event which means we must
		// clear the corresponding model object - `IrcDocument`
		this._subscriptions = vscode.workspace.onDidCloseTextDocument(doc => this._documents.delete(doc.uri.toString()));
	}

	dispose() {
		this._subscriptions.dispose();
		this._documents.clear();
		this._editorDecoration.dispose();
		this._onDidChange.dispose();
	}

	// Expose an event to signal changes of _virtual_ documents to the editor
	get onDidChange() {
		return this._onDidChange.event;
	}

	provideTextDocumentContent(uri: vscode.Uri): string | Thenable<string> {
		let document = this._documents.get(uri.toString());

		// Is the document already loaded?
		if (document) {
			return document.value;
		}
		else {
			document = new IrcDocument(uri, this._onDidChange);
			this._documents.set(uri.toString(), document);
			return document.value;
		}
	}
}

let seq = 0;

// Generate an URI from the server, nick and channel
export function generateUri(ircInstance: IrcInstance): vscode.Uri {
	// The part between the ':' and the '?' will be the title of the tab
	const query = JSON.stringify([ircInstance._server, ircInstance._port, ircInstance._channel, ircInstance._nick]);
	return vscode.Uri.parse(`${Provider.scheme}:IRC?${query}#${seq++}`);
}

// Parse an IRC instance from an URI
export function parseUri(uri: vscode.Uri): IrcInstance {
	let [server, port, channel, nick] = <[string, number, string, string]>JSON.parse(uri.query);
	return new IrcInstance(server, port, channel, nick); 
}
