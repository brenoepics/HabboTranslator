import { ITranslator } from './core/translators/ITranslator';
import 'reflect-metadata';
import { FurnitureDataTranslate } from './translate/FurnituredataTranslate';
import { container } from 'tsyringe';
import { Configuration } from './core/config/Configuration';
import { PrismaClient } from '@prisma/client';

let prisma = null;

(async () =>
{
    
    checkNodeVersion();

    console.log(`
    ░█░█░█▀█░█▀▄░█▀▄░█▀█░░░▀█▀░█▀▄░█▀█░█▀█░█▀▀░█░░░█▀█░▀█▀░█▀█░█▀▄
    ░█▀█░█▀█░█▀▄░█▀▄░█░█░░░░█░░█▀▄░█▀█░█░█░▀▀█░█░░░█▀█░░█░░█░█░█▀▄
    ░▀░▀░▀░▀░▀▀░░▀▀░░▀▀▀░░░░▀░░▀░▀░▀░▀░▀░▀░▀▀▀░▀▀▀░▀░▀░░▀░░▀▀▀░▀░▀
                                                                  
                                                                  `);
    
    const config = container.resolve(Configuration);
    prisma = new PrismaClient();
 
    await config.init()
    const translates = [
        FurnitureDataTranslate,
    ];

    const [ arg1, arg2, ...rest ] = process.argv;

    for(const TranslatorClass of translates)
    {
        const translate = (container.resolve<any>(TranslatorClass) as ITranslator);

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

export function getDatabase(){
return prisma;    
}
