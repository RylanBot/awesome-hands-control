import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../stores/store';
import { getLocalConfig } from '../stores/configSlice';

/* 通过更新 redux 时间戳从而触发读取该钩子，而无需多次手动调用读取配置的 api*/
const useFetchConfig = () => {
    const dispatch = useDispatch();
    const lastUpdated = useSelector((state: RootState) => state.config.lastUpdated);

    useEffect(() => {
        async function fetchConfig() {
            const config = await window.configApi.initialConfig();
            dispatch(getLocalConfig(config));
        };

        fetchConfig();
    }, [dispatch, lastUpdated]);
};

export default useFetchConfig;
