import { autorun, runInAction } from "mobx";
import { ContainerInstance, Service } from "typedi";
import { ConfigService } from "./ConfigService";
import ReactGA from 'react-ga4';

@Service()
class GAService {
	private _ready: boolean = false;

	get ready(): boolean {
		return this._ready;
	}

	public logEvent(category:string, action:string): void {
		ReactGA.event({
			category: category,
			action: action,
		}, (error:any, body:any) => {
			if (error) {
				console.error(error);
			}
		});
	}

	constructor(private readonly _services: ContainerInstance) {
		autorun(async (r) => {
			const cs = this._services.get(ConfigService);
			if (!cs.ready) {
				return;
			}

			ReactGA.initialize(
				String(cs.googleAnalyticsGA4)
			);

			runInAction(() => {
				this._ready = true;
			})

			r.dispose();
		});
	}

}

export { GAService };
