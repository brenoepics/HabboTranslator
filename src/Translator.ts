import { ITranslator } from './core/translators/ITranslator';
import 'reflect-metadata';
import { FurnitureDataTranslate } from './translate/FurnituredataTranslate';
import { container } from 'tsyringe';
import { Configuration } from './core/config/Configuration';


(async () =>
{
    checkNodeVersion();

    console.log(`
    ░█░█░█▀█░█▀▄░█▀▄░█▀█░░░▀█▀░█▀▄░█▀█░█▀█░█▀▀░█░░░█▀█░▀█▀░█▀█░█▀▄
    ░█▀█░█▀█░█▀▄░█▀▄░█░█░░░░█░░█▀▄░█▀█░█░█░▀▀█░█░░░█▀█░░█░░█░█░█▀▄
    ░▀░▀░▀░▀░▀▀░░▀▀░░▀▀▀░░░░▀░░▀░▀░▀░▀░▀░▀░▀▀▀░▀▀▀░▀░▀░░▀░░▀▀▀░▀░▀
                                                                  
                                                                  `)
    const config = container.resolve(Configuration);
    await config.init();
    const translates = [
        FurnitureDataTranslate,
    ];

    const [ arg1, arg2, ...rest ] = process.argv;

    for(const converterClass of translates)
    {
        const translate = (container.resolve<any>(converterClass) as ITranslator);

        await translate.convertAsync(rest);
    }

})();

function checkNodeVersion()
{
    const version = process.version.replace('v', '');
    const major = version.split('.')[0];
    if(parseInt(major) < 14)
    {
        throw new Error('Invalid node version: ' + version + ' please use >= 14');
    }
}
