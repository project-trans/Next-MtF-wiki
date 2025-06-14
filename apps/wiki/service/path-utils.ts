import { getContentGitRootDir } from "@/app/[language]/(documents)/[...slug]/utils";
import path from "node:path";
import { simpleGit } from "simple-git";

export function getLocalImagePath(
  language: string | null,
  slug: string | undefined | null,
  imagePath: string,
  isCurrentSlugIndex: boolean
): string | null {
  if (imagePath.startsWith("/images/")) {
    return imagePath.replace(/^\/images\//, "/hugo-static/images/");
  }
  if (
    imagePath?.startsWith("http://") ||
    imagePath?.startsWith("https://") ||
    imagePath?.startsWith("//")
  ) {
    return imagePath;
  }
  if (imagePath?.startsWith("/")) {
    return `/hugo-files${imagePath}`;
  }
  if (slug && language) {
    const pathname = isCurrentSlugIndex ? slug : path.dirname(slug);
    return `/hugo-files/${language}/${pathname}/${imagePath}`;
  }
  return null;
}

/**
 * 获取指定文件的最近修改时间
 * @param filePath 文件路径（相对于 git 仓库根目录）
 * @returns Promise<Date | null> 返回文件的最近修改时间，如果获取失败则返回 null
 */
export async function getFileLastModifiedTime(filePath: string): Promise<Date | null> {
  try {
    const git = simpleGit(getContentGitRootDir());
    
    // 使用 git log 获取文件的最近提交信息
    const log = await git.log({
      file: path.relative(getContentGitRootDir(), filePath),
      maxCount: 1, // 只获取最近的一次提交
      format: {
        date: '%ai' // ISO 8601 格式的作者日期
      }
    });

    // console.log("log", log);

    if (log.latest?.date) {
      return new Date(log.latest.date);
    }

    return null;
  } catch (error) {
    console.error('获取文件修改时间失败:', error);
    return null;
  }
}