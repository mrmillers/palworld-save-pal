import { getSocketState } from '$states/websocketState.svelte';
import { MessageType, type PassiveSkill, type PassiveSkillDetails } from '$types';

export class PassiveSkills {
	private ws = getSocketState();
	private loading = false;

	passiveSkills: Record<string, PassiveSkill> = $state({});

	private async ensurePassiveSkillsLoaded(): Promise<void> {
		if (Object.keys(this.passiveSkills).length === 0 && !this.loading) {
			try {
				this.loading = true;
				const response = await this.ws.sendAndWait({
					type: MessageType.GET_PASSIVE_SKILLS
				});
				if (response.type === 'error') {
					throw new Error(response.data);
				}
				this.passiveSkills = response.data;
				this.loading = false;
			} catch (error) {
				console.error('Error fetching passive skills:', error);
				throw error;
			}
		}
		if (this.loading) {
			await new Promise((resolve) => setTimeout(resolve, 100));
			await this.ensurePassiveSkillsLoaded();
		}
	}

	async searchPassiveSkills(search: string): Promise<PassiveSkill | undefined> {
		await this.ensurePassiveSkillsLoaded();
		return this.getByKey(search) || this.getByName(search) || undefined;
	}

	private getByKey(key: string): PassiveSkill | undefined {
		return this.passiveSkills[key];
	}

	private getByName(name: string): PassiveSkill | undefined {
		return Object.values(this.passiveSkills).find(
			(skill) => skill.name.toLowerCase() === name.toLowerCase()
		);
	}

	async getPassiveSkills(): Promise<PassiveSkill[]> {
		await this.ensurePassiveSkillsLoaded();
		return Object.values(this.passiveSkills);
	}

	async getField(
		key: string,
		field: keyof PassiveSkill | keyof PassiveSkillDetails
	): Promise<string | null> {
		const passiveSkill = await this.searchPassiveSkills(key);
		if (passiveSkill) {
			if (field in passiveSkill) {
				return passiveSkill[field as keyof PassiveSkill] as string;
			} else if (field in passiveSkill.details) {
				return passiveSkill.details[field as keyof PassiveSkillDetails] as string;
			}
		}
		return null;
	}

	async searchPassiveSkillsByTier(tier: string): Promise<PassiveSkill[]> {
		await this.ensurePassiveSkillsLoaded();
		return Object.values(this.passiveSkills).filter(
			(skill) => skill.details.tier.toLowerCase() === tier.toLowerCase()
		);
	}
}

export const passiveSkillsData = new PassiveSkills();