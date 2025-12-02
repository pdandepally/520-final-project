/**
 * Underage Blocked Page - Displayed when users under 18 try to sign up
 * Includes anti-child labor resources and information
 */

import { Button } from "@/components/ui/button";
import { AlertTriangle, ExternalLink, Home } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";

export default function UnderageBlockedPage() {
  const { t } = useLanguage();

  const resources = [
    {
      name: "International Labour Organization (ILO)",
      url: "https://www.ilo.org/global/topics/child-labour/lang--en/index.htm",
      description: t('underage.iloDesc'),
    },
    {
      name: "Secretaría del Trabajo y Previsión Social (STPS)",
      url: "https://www.gob.mx/stps",
      description: t('underage.dolDesc'),
    },
    {
      name: "UNICEF - Child Protection",
      url: "https://www.unicef.org/protection/child-labour",
      description: t('underage.unicefDesc'),
    },
    {
      name: "Child Labor Coalition",
      url: "https://stopchildlabor.org/",
      description: t('underage.clcDesc'),
    },
  ];

  return (
    <div className="bg-gradient-to-b from-red-50 to-orange-50 flex min-h-screen flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col gap-6">
          {/* Warning Icon */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="size-12" />
            </div>
            <h1 className="text-3xl font-bold text-red-800 text-center">
              {t('underage.title')}
            </h1>
          </div>

          {/* Main Message */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
            <p className="text-lg text-gray-800 text-center mb-4">
              {t('underage.message')}
            </p>
            <p className="text-md text-gray-700 text-center">
              {t('underage.emailSaved')}
            </p>
          </div>

          {/* Why This Matters */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-orange-900 mb-3">
              {t('underage.whyTitle')}
            </h2>
            <p className="text-gray-700 mb-3">
              {t('underage.whyContent')}
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>{t('underage.reason1')}</li>
              <li>{t('underage.reason2')}</li>
              <li>{t('underage.reason3')}</li>
              <li>{t('underage.reason4')}</li>
            </ul>
          </div>

          {/* Resources Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {t('underage.resourcesTitle')}
            </h2>
            <div className="space-y-3">
              {resources.map((resource) => (
                <a
                  key={resource.url}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-blue-50 border-2 border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900 mb-1">
                        {resource.name}
                      </h3>
                      <p className="text-sm text-gray-700">
                        {resource.description}
                      </p>
                    </div>
                    <ExternalLink className="h-5 w-5 text-blue-600 flex-shrink-0 mt-1" />
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Emergency Contact Information */}
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-900 mb-3">
              {t('underage.needHelpTitle')}
            </h2>
            <p className="text-gray-700 mb-3">
              {t('underage.needHelpContent')}
            </p>
            <div className="space-y-2">
              <p className="text-gray-800">
                <strong>{t('underage.nationalHotline')}:</strong> 800 440 3690
              </p>
              <p className="text-gray-800">
                <strong>{t('underage.textLine')}:</strong> {t('underage.textInfo')}
              </p>
            </div>
          </div>

          {/* Return Home Button */}
          <div className="flex justify-center pt-4">
            <Link href="/">
              <Button className="bg-green-600 hover:bg-green-700 text-white font-semibold gap-2">
                <Home className="h-4 w-4" />
                {t('underage.returnHome')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
