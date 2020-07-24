import { SerializableObject, Version } from "./serialization";
export interface ITypeRegistration<T extends SerializableObject> {
    typeName: string;
    objectType: {
        new (): T;
    };
    schemaVersion: Version;
}
export declare class CardObjectRegistry<T extends SerializableObject> {
    private _items;
    findByName(typeName: string): ITypeRegistration<T> | undefined;
    clear(): void;
    register(typeName: string, objectType: {
        new (): T;
    }, schemaVersion?: Version): void;
    unregister(typeName: string): void;
    createInstance(typeName: string, targetVersion: Version): T | undefined;
    getItemCount(): number;
    getItemAt(index: number): ITypeRegistration<T>;
}
