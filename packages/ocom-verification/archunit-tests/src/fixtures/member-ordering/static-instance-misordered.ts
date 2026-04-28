export class MisorderedMembers {
	instanceField = 42;

	doSomething(): void {
		// instance method appears before static method — violation
	}

	static staticMethod(): void {
		// static method after instance method
	}
}
