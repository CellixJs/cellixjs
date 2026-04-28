export class ValidMixedMembers {
	static staticField = 'hello';

	instanceField = 42;

	get name(): string {
		return 'test';
	}

	doSomething(): void {
		// method
	}

	set value(v: number) {
		this.instanceField = v;
	}

	anotherMethod(): string {
		return 'ok';
	}
}
