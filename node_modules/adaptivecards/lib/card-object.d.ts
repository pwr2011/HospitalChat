import * as Enums from "./enums";
import { Dictionary } from "./shared";
import { HostConfig } from "./host-config";
import { HostCapabilities } from "./host-capabilities";
import { SerializableObject, StringProperty, SerializableObjectProperty, IValidationEvent, PropertyDefinition } from "./serialization";
export declare class ValidationResults {
    readonly allIds: Dictionary<number>;
    readonly validationEvents: IValidationEvent[];
    addFailure(cardObject: CardObject, event: Enums.ValidationEvent, message: string): void;
}
export declare type CardObjectType = {
    new (): CardObject;
};
export declare abstract class CardObject extends SerializableObject {
    static readonly typeNameProperty: StringProperty;
    static readonly idProperty: StringProperty;
    static readonly requiresProperty: SerializableObjectProperty;
    protected getSchemaKey(): string;
    id?: string;
    get requires(): HostCapabilities;
    private _shouldFallback;
    protected _parent?: CardObject;
    protected _renderedElement?: HTMLElement;
    onPreProcessPropertyValue?: (sender: CardObject, property: PropertyDefinition, value: any) => any;
    abstract getJsonTypeName(): string;
    abstract get hostConfig(): HostConfig;
    preProcessPropertyValue(property: PropertyDefinition, propertyValue?: any): any;
    setParent(value: CardObject | undefined): void;
    setShouldFallback(value: boolean): void;
    shouldFallback(): boolean;
    getRootObject(): CardObject;
    internalValidateProperties(context: ValidationResults): void;
    validateProperties(): ValidationResults;
    get parent(): CardObject | undefined;
    get renderedElement(): HTMLElement | undefined;
}
