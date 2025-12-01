import { useQuery } from '@apollo/client';
import { ComponentQueryLoader } from '@cellix/ui-core';
import { AccountsUserInfoContainerCurrentEndUserAndCreateIfNotExistsDocument } from '../../../../generated.tsx';
import { UserInfo } from './user-info.tsx';

export const UserInfoContainer: React.FC = () => {
    const { loading, error, data } = useQuery(AccountsUserInfoContainerCurrentEndUserAndCreateIfNotExistsDocument);

    return (
        <ComponentQueryLoader
            loading={loading}
            error={error}
            hasData={data?.currentEndUserAndCreateIfNotExists}
            hasDataComponent={data?.currentEndUserAndCreateIfNotExists ? <UserInfo userData={data.currentEndUserAndCreateIfNotExists} /> : <></>}
            noDataComponent={<div>No User Data</div>}
        />
    )
}