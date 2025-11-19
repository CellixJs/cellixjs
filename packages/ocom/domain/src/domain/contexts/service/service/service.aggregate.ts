import { AggregateRoot } from '@cellix/domain-seedwork/aggregate-root';
import { PermissionError } from '@cellix/domain-seedwork/domain-entity';
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
import {
	Community,
	type CommunityEntityReference,
	type CommunityProps,
} from '../../community/community/community.ts';
import type { Passport } from '../../passport.ts';
import type { ServiceVisa } from '../service.visa.ts';
import * as ValueObjects from './service.value-objects.ts';

export interface ServiceProps extends DomainEntityProps {
	readonly community: CommunityProps;
	setCommunityRef(community: CommunityEntityReference): void;
	serviceName: string;
	description: string;
	isActive: boolean;

	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly schemaVersion: string;
}

export interface ServiceEntityReference
	extends Readonly<Omit<ServiceProps, 'community' | 'setCommunityRef'>> {
	get community(): CommunityEntityReference;
}

export class Service<props extends ServiceProps>
	extends AggregateRoot<props, Passport>
	implements ServiceEntityReference
{
	private isNew: boolean = false;
	private readonly visa: ServiceVisa;
	constructor(props: props, passport: Passport) {
		super(props, passport);
		this.visa = passport.service.forService(this);
	}

	public static getNewInstance<props extends ServiceProps>(
		newProps: props,
		serviceName: string,
		description: string,
		community: CommunityEntityReference,
		passport: Passport,
	): Service<props> {
		const service = new Service(newProps, passport);
		service.isNew = true;
		service.serviceName = serviceName;
		service.description = description;
		service.community = community;
		service.isActive = true;
		service.isNew = false;
		return service;
	}

	get community(): CommunityEntityReference {
		return new Community(this.props.community, this.passport);
	}

	private set community(community: CommunityEntityReference) {
		if (!this.isNew) {
			throw new PermissionError('Unauthorized');
		}
		this.props.setCommunityRef(community);
	}
	get serviceName() {
		return this.props.serviceName;
	}
	set serviceName(serviceName: string) {
		if (
			!this.visa.determineIf((permissions) => permissions.canManageServices)
		) {
			throw new PermissionError(
				'You do not have permission to change the service name',
			);
		}
		this.props.serviceName = new ValueObjects.ServiceName(
			serviceName,
		).valueOf();
	}
	get description() {
		return this.props.description;
	}
	set description(description: string) {
		if (
			!this.visa.determineIf((permissions) => permissions.canManageServices)
		) {
			throw new PermissionError(
				'You do not have permission to change the service description',
			);
		}
		this.props.description = new ValueObjects.Description(
			description,
		).valueOf();
	}
	get isActive() {
		return this.props.isActive;
	}
	set isActive(isActive: boolean) {
		if (
			!this.visa.determineIf((permissions) => permissions.canManageServices)
		) {
			throw new PermissionError(
				'You do not have permission to change the service status',
			);
		}
		this.props.isActive = isActive;
	}
	get createdAt(): Date {
		return this.props.createdAt;
	}
	get updatedAt(): Date {
		return this.props.updatedAt;
	}
	get schemaVersion(): string {
		return this.props.schemaVersion;
	}
}

//#region Exports
export type { ServiceRepository } from './service.repository.ts';
export type { ServiceUnitOfWork } from './service.uow.ts';
//#endregion
