export interface ITranslator
{
    convertAsync(args?: string[]): Promise<void>;
}
