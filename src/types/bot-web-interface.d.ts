declare module "bot-web-interface" {
    interface BotWebInterfaceConfig {
        port: number;
        password?: string | null;
        updateRate: number;
    }

    interface Publisher {
        setDefaultStructure(
            schema: Array<{
                name: string;
                type: string;
                label: string;
                options?: Record<string, any>;
            }>
        ): void;
        createInterface(schema?: any): Interface;
    }

    interface Interface {
        setDataSource(source: () => Record<string, any>): void;
    }

    class BotWebInterface {
        constructor(config: BotWebInterfaceConfig);
        publisher: Publisher;
    }

    export = BotWebInterface;
}
