import SuggestionBox from '@/components/SuggestionBox';
import { Ruler, Shield } from 'lucide-react';
import { CupCalculator } from './components/CupCalculator';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;
  return {
    title: '罩杯计算器 - MtF.wiki',
  };
}

export default async function CupCalculatorPage({
  params,
}: {
  params: Promise<{ language: string }>;
}) {
  const { language } = await params;

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto">
        {/* 页面头部 */}
        <header className="text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
              <Ruler className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-base-content">罩杯计算器</h1>
          </div>
          <p className="text-base-content/70 text-lg max-w-2xl mx-auto">
            {/* description */}
          </p>
        </header>

        {/* 使用说明
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-xl p-6 mb-8 border border-pink-200/30 dark:border-pink-800/30">
          <h2 className="text-xl font-semibold text-base-content mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            使用说明
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-base-content mb-2">测量准备</h3>
              <ul className="text-sm text-base-content/70 space-y-1">
                <li>• 准备一根软尺（布尺）</li>
                <li>• 面对镜子，确保能看到胸部</li>
                <li>• 穿着合适的内衣或不穿内衣</li>
                <li>• 保持自然站立姿势</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-base-content mb-2">测量要点</h3>
              <ul className="text-sm text-base-content/70 space-y-1">
                <li>• 软尺要贴合身体，不要过紧或过松</li>
                <li>• 保持水平，避免倾斜</li>
                <li>• 按照指引完成5个步骤的测量</li>
                <li>• 每个数值都很重要，请认真测量</li>
              </ul>
            </div>
          </div>
        </div> */}

        {/* 主要计算器 */}
        <CupCalculator />

        {/* 页面底部信息 */}
        <footer className="mt-8 md:mt-12 p-4 md:p-6 bg-base-200/50 rounded-xl">
          <div className="text-sm text-base-content/60 space-y-3">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-base-content mb-1">隐私保护</p>
                <p>
                  所有测量数据和计算结果仅存储在您的浏览器本地，不会上传到服务器。
                  您可以随时清除历史记录，保护个人隐私。
                </p>
              </div>
            </div>

            <div className="border-t border-base-300/30 pt-3">
              <p>
                <strong>免责声明：</strong>
                计算结果仅供参考。
                由于个体差异和品牌差异，建议在购买内衣时进行试穿确认。
                如有特殊需求，请咨询商家或专业人士。
              </p>
            </div>

            <div className="border-t border-base-300/30 pt-3">
              <p>
                <strong>算法说明：</strong>
                胸下围 = (放松测量 + 呼气测量) ÷ 2， 罩杯差值 = (胸围放松 +
                胸围45° + 胸围90°) ÷ 3 - 胸下围， 最终尺寸 =
                胸下围(向上取整到5的倍数) + 对应罩杯字母
              </p>
            </div>
          </div>
        </footer>
        <div className="mt-8">
          <SuggestionBox language={language} />
        </div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return [{ language: 'zh-cn' }];
}
