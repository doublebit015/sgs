import { HujiaSkill } from 'core/skills/characters/standard/hujia';
import { JianXiongSkill } from 'core/skills/characters/standard/jianxiong';
import { JiJiangShadowSkill, JiJiangSkill } from 'core/skills/characters/standard/jijiang';
import { JinkSkill } from 'core/skills/characters/standard/jink';
import { JiuYuan } from 'core/skills/characters/standard/jiuyuan';
import { JiZhiSkill } from 'core/skills/characters/standard/jizhi';
import { PeachSkill } from 'core/skills/characters/standard/peach';
import { QiCaiSkill } from 'core/skills/characters/standard/qicai';
import { QingGangSkill } from 'core/skills/characters/standard/qinggang';
import { RendeSkill } from 'core/skills/characters/standard/rende';
import { SlashSkill } from 'core/skills/characters/standard/slash';
import { ZhiHeng } from 'core/skills/characters/standard/zhiheng';
import { ZhuGeLianNuSlashSkill } from 'core/skills/characters/standard/zhugeliannu_slash';
import { ZiXinSkill } from 'core/skills/characters/standard/zixin';
import { Skill } from 'core/skills/skill';

const allSkills = [
  new SlashSkill(),
  new ZhiHeng(),
  new JiuYuan(),
  new ZiXinSkill(),
  new PeachSkill(),
  new JinkSkill(),
  new HujiaSkill(),
  new JianXiongSkill(),
  new JiJiangSkill(),
  new JiJiangShadowSkill(),
  new JiZhiSkill(),
  new QiCaiSkill(),
  new RendeSkill(),
  new ZhuGeLianNuSlashSkill(),
  new QingGangSkill(),
];

export class SkillLoader {
  private constructor(private skills: Skill[] = allSkills) {}

  private static instance: SkillLoader;

  public static getInstance() {
    if (!this.instance) {
      this.instance = new SkillLoader();
    }

    return this.instance;
  }

  public getAllSkills() {
    return this.skills;
  }

  public getSkillByName<S extends Skill = Skill>(skillName: string): S {
    const skill = this.skills.find(skill => skill.Name === skillName);
    if (skill === undefined) {
      throw new Error(`Unable to get skill ${skillName}`);
    }

    return skill as S;
  }
  public getSkillsByName<S extends Skill = Skill>(skillName: string): S[] {
    const skill = this.skills.filter(skill => skill.Name === skillName);
    if (skill === undefined) {
      throw new Error(`Unable to get skill ${skillName}`);
    }

    return skill as S[];
  }
}
