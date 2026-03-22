import React from 'react';
import GarbageWastePickup from './tasks/GarbageWastePickup.worker';
import HouseholdWastePickup from './tasks/HouseholdWastePickup.worker';
import DustbinMaintenance from './tasks/DustbinMaintenance.worker';
import DeadAnimalPickup from './tasks/DeadAnimalPickup.worker';
import DustbinInstallation from './tasks/DustbinInstallation.worker';
import WorkerNotices from './WorkerNotices';
import ContactAdmin from './ContactAdmin';

export const workerRoutes = {
    'garbage': {
        component: GarbageWastePickup,
        label: 'Garbage & Waste'
    },
    'household': {
        component: HouseholdWastePickup,
        label: 'Household Pickup'
    },
    'dustbin-maint': {
        component: DustbinMaintenance,
        label: 'Dustbin Maintenance'
    },
    'dead-animal': {
        component: DeadAnimalPickup,
        label: 'Dead Animal Pickup'
    },
    'dustbin-install': {
        component: DustbinInstallation,
        label: 'Dustbin Installation'
    },
    'notices': {
        component: WorkerNotices,
        label: 'Notices'
    },
    'contact': {
        component: ContactAdmin,
        label: 'Contact Admin'
    }
};

export const renderWorkerSection = (section, onBack) => {
    const RouteComponent = workerRoutes[section]?.component;
    if (RouteComponent) {
        return <RouteComponent onBack={onBack} />;
    }
    return null;
};

export default workerRoutes;
