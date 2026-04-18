export class FilePin {
	constructor(readonly fileName: string) {}

	matches(file: { readonly name: string }): boolean {
		return file.name === this.fileName;
	}
}
