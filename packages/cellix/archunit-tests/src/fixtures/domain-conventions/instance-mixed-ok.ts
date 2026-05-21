// Fixture: Class with mixed instance methods and accessors (should pass member ordering)
export class ValidMixedMembers {
	static staticField = 'hello';

	instanceField = 42;

	instanceField2 = 0;

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
