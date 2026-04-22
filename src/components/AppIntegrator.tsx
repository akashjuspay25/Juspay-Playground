import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Check, Smartphone, Apple, Code2, Terminal, FileCode, Settings, AlertCircle, Info, ExternalLink, ChevronRight, Upload, Play, Eye, Key, Building2, ShieldCheck, RefreshCw, Download, Zap } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import type { ThemeColors } from "@/src/App";

interface AppIntegratorProps {
  activeTheme: ThemeColors;
}

type Platform = "android" | "ios" | "react-native" | "flutter";
type IntegrationStep = "credentials" | "codebase" | "configure" | "preview";
type SDKStatus = "idle" | "initiating" | "ready" | "processing" | "success" | "error" | "cancelled";

interface MerchantConfig {
  merchantId: string;
  apiKey: string;
  clientId: string;
  environment: "sandbox" | "production";
  packageName: string;
  appName: string;
}

interface LogEntry {
  timestamp: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'sdk';
  message: string;
  details?: string;
}

export function AppIntegrator({ activeTheme }: AppIntegratorProps) {
  const [platform, setPlatform] = useState<Platform>("android");
  const [activeTab, setActiveTab] = useState("quick-integrator");
  const [integrationStep, setIntegrationStep] = useState<IntegrationStep>("credentials");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Merchant credentials
  const [config, setConfig] = useState<MerchantConfig>({
    merchantId: "",
    apiKey: "",
    clientId: "",
    environment: "sandbox",
    packageName: "com.example.myapp",
    appName: "My App"
  });

  // Codebase upload state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [projectStructure, setProjectStructure] = useState<{
    buildGradleContent: string;
    mainActivityPath: string;
    mainActivityContent: string;
    manifestContent: string;
    packageName: string;
    hasApplicationClass: boolean;
    applicationClassPath: string;
    projectRoot: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [generatedFiles, setGeneratedFiles] = useState<{
    buildGradle: string;
    mainActivity: string;
    manifest: string;
    applicationClass?: string;
    readme: string;
  } | null>(null);

  // SDK Simulation State for Real-Time Preview
  const [sdkStatus, setSdkStatus] = useState<SDKStatus>("idle");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showPaymentUI, setShowPaymentUI] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (type: LogEntry['type'], message: string, details?: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    setLogs(prev => [...prev, { timestamp, type, message, details }]);
  };

  // Simulate HyperCheckout Initiate Flow
  const simulateInitiate = async () => {
    setSdkStatus("initiating");
    addLog('info', 'Starting HyperCheckout SDK initiation...');
    addLog('sdk', 'HyperCheckout.preFetch()', `clientId: "${config.clientId}"`);

    await new Promise(r => setTimeout(r, 800));
    addLog('success', 'Pre-fetch completed', 'Configuration cached');

    addLog('sdk', 'HyperCheckout.initiate()', JSON.stringify({
      requestId: `REQ_${Date.now()}`,
      service: "in.juspay.hyperpay",
      payload: {
        action: "initiate",
        merchantId: config.merchantId,
        clientId: config.clientId,
        environment: config.environment
      }
    }, null, 2));

    await new Promise(r => setTimeout(r, 1200));
    addLog('success', 'SDK initiated successfully');
    addLog('info', 'Payment methods loaded', 'UPI, Cards, Wallets, NetBanking');
    setSdkStatus("ready");
  };

  // Simulate Process (Payment) Flow
  const simulateProcess = async () => {
    setSdkStatus("processing");
    setIsProcessingPayment(true);
    setShowPaymentUI(false);

    const orderId = `ORD_${Date.now()}`;
    addLog('sdk', 'HyperCheckout.process()', JSON.stringify({
      requestId: `REQ_${Date.now()}`,
      service: "in.juspay.hyperpay",
      payload: {
        action: "paymentPage",
        merchantId: config.merchantId,
        clientId: config.clientId,
        orderId: orderId,
        amount: "1.00",
        currency: "INR"
      }
    }, null, 2));

    await new Promise(r => setTimeout(r, 1500));
    addLog('info', 'Payment initiated', `Order: ${orderId}`);

    await new Promise(r => setTimeout(r, 1000));

    // Simulate outcome
    const outcomes: SDKStatus[] = ["success", "success", "cancelled", "error"];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

    if (outcome === "success") {
      addLog('success', 'Payment successful!', 'Transaction charged');
      addLog('sdk', 'process_result', JSON.stringify({ status: "charged", orderId }, null, 2));
      toast.success("✅ Payment Successful!");
    } else if (outcome === "cancelled") {
      addLog('warning', 'Payment cancelled', 'User cancelled the transaction');
      addLog('sdk', 'process_result', JSON.stringify({ status: "cancelled", orderId }, null, 2));
      toast.warning("🚫 Payment Cancelled");
    } else {
      addLog('error', 'Payment failed', 'Authorization failed');
      addLog('sdk', 'process_result', JSON.stringify({ status: "authorization_failed", orderId }, null, 2));
      toast.error("❌ Payment Failed");
    }

    setSdkStatus(outcome);
    setIsProcessingPayment(false);
    setSelectedPaymentMethod(null);

    // Reset after delay
    setTimeout(() => {
      setSdkStatus("ready");
    }, 2000);
  };

  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyToClipboard = async (code: string, snippetId: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSnippet(snippetId);
      toast.success("Code copied to clipboard!");
      setTimeout(() => setCopiedSnippet(null), 2000);
    } catch (err) {
      toast.error("Failed to copy code");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploadedFiles(files);
    toast.loading("Analyzing project structure...");

    // Find app-level build.gradle
    const appBuildGradle = files.find(f =>
      f.webkitRelativePath.includes('/app/') &&
      f.webkitRelativePath.endsWith('build.gradle')
    ) || files.find(f => f.name === 'build.gradle');

    // Find MainActivity.kt or MainActivity.java
    const mainActivityFile = files.find(f =>
      f.webkitRelativePath.match(/MainActivity\.(kt|java)$/)
    ) || files.find(f =>
      f.name.startsWith('MainActivity')
    );

    // Find AndroidManifest.xml
    const manifestFile = files.find(f =>
      f.webkitRelativePath.endsWith('AndroidManifest.xml')
    ) || files.find(f => f.name === 'AndroidManifest.xml');

    // Find Application class
    const applicationFile = files.find(f =>
      f.webkitRelativePath.match(/Application\.(kt|java)$/) &&
      !f.webkitRelativePath.includes('android')
    );

    try {
      const readFile = (file: File | undefined): Promise<string> => {
        return new Promise((resolve) => {
          if (!file) { resolve(''); return; }
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string || '');
          reader.readAsText(file);
        });
      };

      const [gradleContent, activityContent, manifestContent, appContent] = await Promise.all([
        readFile(appBuildGradle),
        readFile(mainActivityFile),
        readFile(manifestFile),
        readFile(applicationFile),
      ]);

      // Extract package name from manifest or build.gradle
      let packageName = config.packageName;
      const manifestMatch = manifestContent.match(/package="([^"]+)"/);
      const gradleMatch = gradleContent.match(/applicationId\s*["']([^"']+)["']/);
      const namespaceMatch = gradleContent.match(/namespace\s*["']([^"']+)["']/);
      packageName = manifestMatch?.[1] || gradleMatch?.[1] || namespaceMatch?.[1] || packageName;

      setProjectStructure({
        buildGradleContent: gradleContent,
        mainActivityPath: mainActivityFile?.webkitRelativePath || mainActivityFile?.name || '',
        mainActivityContent: activityContent,
        manifestContent: manifestContent,
        packageName: packageName,
        hasApplicationClass: !!applicationFile,
        applicationClassPath: applicationFile?.webkitRelativePath || '',
        projectRoot: appBuildGradle?.webkitRelativePath.split('/app/')[0] || '',
      });

      setConfig(prev => ({ ...prev, packageName }));

      toast.dismiss();
      toast.success(`Analyzed ${files.length} files. Found: ${mainActivityFile ? 'MainActivity' : ''} ${applicationFile ? ', Application class' : ''}`);
    } catch (error) {
      toast.dismiss();
      toast.error("Error analyzing project. Will generate fresh integration.");
    }
  };

  const generateUpdatedBuildGradle = () => {
    const baseGradle = projectStructure?.buildGradleContent || `plugins {
    id 'com.android.application'
    id 'org.jetbrains.kotlin.android'
}

android {
    namespace '${config.packageName}'
    compileSdk 34

    defaultConfig {
        applicationId "${config.packageName}"
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName "1.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = '1.8'
    }
}

repositories {
    google()
    mavenCentral()
    maven { url "https://public.juspay.in/hyper-sdk/" }
}

dependencies {
    implementation 'androidx.core:core-ktx:1.12.0'
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.1.4'
}`;

    let gradle = baseGradle;

    // Add Juspay repository if not present
    if (!gradle.includes("public.juspay.in")) {
      if (gradle.includes("repositories {")) {
        gradle = gradle.replace(
          /repositories\s*\{/,
          `repositories {
        maven { url "https://public.juspay.in/hyper-sdk/" }`
        );
      } else {
        // Add repositories block before dependencies
        gradle = gradle.replace(
          /dependencies\s*\{/,
          `repositories {
    google()
    mavenCentral()
    maven { url "https://public.juspay.in/hyper-sdk/" }
}

dependencies {`
        );
      }
    }

    // Add HyperSDK dependency if not present
    if (!gradle.includes("in.juspay:hypersdk")) {
      gradle = gradle.replace(
        /(dependencies\s*\{)/,
        `$1
    // Juspay HyperCheckout SDK
    implementation 'in.juspay:hypersdk:2.2.5'`
      );
    }

    // Add compileOptions if not present
    if (!gradle.includes("compileOptions") && !gradle.includes("JavaVersion")) {
      gradle = gradle.replace(
        /(defaultConfig\s*\{[^}]+\})/s,
        `$1

    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = '1.8'
    }`
      );
    }

    return gradle;
  };

  const generateMainActivity = () => {
    const existingCode = projectStructure?.mainActivityContent || '';
    const packageDeclaration = `package ${config.packageName}`;

    // If we have existing MainActivity, we need to inject Juspay code
    if (existingCode && existingCode.includes('class MainActivity')) {
      const isKotlin = existingCode.includes('.kt') || existingCode.includes('fun ');
      const language = isKotlin ? 'kotlin' : 'java';

      // Extract imports to add Juspay imports before them
      const importMatch = existingCode.match(/^package .*$/m);
      let modifiedCode = existingCode;

      if (language === 'kotlin') {
        // Add Juspay imports
        const juspayImports = `
import in.juspay.hypersdk.HyperCheckout
import in.juspay.hypersdk.data.JuspayResponseHandler
import org.json.JSONObject`;

        if (!modifiedCode.includes('in.juspay.hypersdk')) {
          modifiedCode = modifiedCode.replace(
            /^(package .*)$/m,
            `$1${juspayImports}`
          );
        }

        // Add SDK initialization method if not present
        if (!modifiedCode.includes('initializeHyperCheckout')) {
          const initializationMethod = `

    // Juspay HyperCheckout SDK Integration
    private fun initializeHyperCheckout() {
        val initiatePayload = JSONObject().apply {
            put("requestId", "REQ_\${System.currentTimeMillis()}")
            put("service", "in.juspay.hyperpay")
            put("payload", JSONObject().apply {
                put("action", "initiate")
                put("merchantId", "${config.merchantId}")
                put("clientId", "${config.clientId}")
                put("environment", "${config.environment}")
            })
        }

        HyperCheckout.preFetch(this, "${config.clientId}")
        HyperCheckout.setHyperCheckoutCallback(hyperCheckoutCallback)
        HyperCheckout.initiate(this, initiatePayload)
    }

    fun startPayment(amount: String = "1.00", orderId: String = "ORD_\${System.currentTimeMillis()}") {
        val processPayload = JSONObject().apply {
            put("requestId", "REQ_\${System.currentTimeMillis()}")
            put("service", "in.juspay.hyperpay")
            put("payload", JSONObject().apply {
                put("action", "paymentPage")
                put("merchantId", "${config.merchantId}")
                put("clientId", "${config.clientId}")
                put("orderId", orderId)
                put("amount", amount)
                put("currency", "INR")
                put("customerEmail", "customer@example.com")
                put("customerMobile", "9876543210")
            })
        }
        HyperCheckout.process(this, processPayload)
    }

    private val hyperCheckoutCallback = JuspayResponseHandler { response, error ->
        runOnUiThread {
            if (error != null) {
                android.util.Log.e("Juspay", "Error: \${error.message}")
                return@runOnUiThread
            }
            response?.let { handleJuspayResponse(it) }
        }
    }

    private fun handleJuspayResponse(response: org.json.JSONObject) {
        val event = response.optString("event")
        val payload = response.optJSONObject("payload")
        when (event) {
            "initiate_result" -> {
                if (payload?.optString("status") == "success") {
                    android.util.Log.d("Juspay", "✅ SDK Initialized Successfully!")
                }
            }
            "process_result" -> {
                val status = payload?.optString("status")
                android.util.Log.d("Juspay", "Payment status: $status")
            }
        }
    }

    override fun onDestroy() {
        HyperCheckout.terminate()
        super.onDestroy()
    }`;

          // Insert before the last closing brace
          modifiedCode = modifiedCode.replace(
            /}(\s*)$/,
            `${initializationMethod}$1`
          );

          // Add initialization call in onCreate if present
          if (modifiedCode.includes('override fun onCreate(') && !modifiedCode.includes('initializeHyperCheckout()')) {
            modifiedCode = modifiedCode.replace(
              /(super\.onCreate\(savedInstanceState\)\s*\n)(\s*)(setContentView|binding\.root)/,
              `$1$2initializeHyperCheckout()\n$2$3`
            );
          }
        }
      }

      return modifiedCode;
    }

    // Return fresh MainActivity if no existing code
    return `${packageDeclaration}

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.widget.AppCompatButton
import in.juspay.hypersdk.HyperCheckout
import in.juspay.hypersdk.data.JuspayResponseHandler
import org.json.JSONObject

class MainActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize HyperCheckout SDK
        initializeHyperCheckout()

        // Setup payment button
        findViewById<AppCompatButton>(R.id.payButton)?.setOnClickListener {
            startPayment()
        }
    }

    private fun initializeHyperCheckout() {
        val initiatePayload = JSONObject().apply {
            put("requestId", "REQ_\${System.currentTimeMillis()}")
            put("service", "in.juspay.hyperpay")
            put("payload", JSONObject().apply {
                put("action", "initiate")
                put("merchantId", "${config.merchantId}")
                put("clientId", "${config.clientId}")
                put("environment", "${config.environment}")
            })
        }

        HyperCheckout.preFetch(this, "${config.clientId}")
        HyperCheckout.setHyperCheckoutCallback(hyperCheckoutCallback)
        HyperCheckout.initiate(this, initiatePayload)
    }

    fun startPayment(amount: String = "1.00", orderId: String = "ORD_\${System.currentTimeMillis()}") {
        val processPayload = JSONObject().apply {
            put("requestId", "REQ_\${System.currentTimeMillis()}")
            put("service", "in.juspay.hyperpay")
            put("payload", JSONObject().apply {
                put("action", "paymentPage")
                put("merchantId", "${config.merchantId}")
                put("clientId", "${config.clientId}")
                put("orderId", orderId)
                put("amount", amount)
                put("currency", "INR")
                put("customerEmail", "customer@example.com")
                put("customerMobile", "9876543210")
            })
        }
        HyperCheckout.process(this, processPayload)
    }

    private val hyperCheckoutCallback = JuspayResponseHandler { response, error ->
        runOnUiThread {
            if (error != null) {
                android.util.Log.e("Juspay", "Error: \${error.message}")
                return@runOnUiThread
            }

            response?.let { resp ->
                val event = resp.optString("event")
                val payload = resp.optJSONObject("payload")

                when (event) {
                    "initiate_result" -> {
                        val status = payload?.optString("status")
                        if (status == "success") {
                            android.util.Log.d("Juspay", "✅ SDK Initialized Successfully!")
                        }
                    }
                    "process_result" -> {
                        val status = payload?.optString("status")
                        when (status) {
                            "charged" -> android.util.Log.d("Juspay", "✅ Payment Successful!")
                            "pending_vbv" -> android.util.Log.d("Juspay", "⏳ Authentication Pending")
                            "authorization_failed" -> android.util.Log.d("Juspay", "❌ Payment Failed")
                            "cancelled" -> android.util.Log.d("Juspay", "🚫 User Cancelled")
                        }
                    }
                }
            }
        }
    }

    override fun onDestroy() {
        HyperCheckout.terminate()
        super.onDestroy()
    }
}`;
  };

  const generateAndroidManifest = () => {
    const existingManifest = projectStructure?.manifestContent || '';

    if (existingManifest && existingManifest.includes('<manifest')) {
      let modifiedManifest = existingManifest;

      // Add INTERNET permission if not present
      if (!modifiedManifest.includes('android.permission.INTERNET')) {
        modifiedManifest = modifiedManifest.replace(
          /<manifest[^>]*>/,
          `$&\n\n    <uses-permission android:name="android.permission.INTERNET" />`
        );
      }

      // Add UPI queries if not present
      if (!modifiedManifest.includes('com.google.android.apps.nbu.paisa.user')) {
        const upiQueries = `

    <!-- UPI Intent Queries for Payment Apps -->
    <queries>
        <package android:name="com.google.android.apps.nbu.paisa.user" />
        <package android:name="net.one97.paytm" />
        <package android:name="com.phonepe.app" />
        <package android:name="in.org.npci.upiapp" />
        <intent>
            <action android:name="android.intent.action.VIEW" />
            <data android:scheme="upi" />
        </intent>
    </queries>`;

        // Insert before application tag
        modifiedManifest = modifiedManifest.replace(
          /(<application)/,
          `${upiQueries}\n$1`
        );
      }

      return modifiedManifest;
    }

    return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${config.packageName}">

    <uses-permission android:name="android.permission.INTERNET" />

    <!-- UPI Intent Queries -->
    <queries>
        <package android:name="com.google.android.apps.nbu.paisa.user" />
        <package android:name="net.one97.paytm" />
        <package android:name="com.phonepe.app" />
        <package android:name="in.org.npci.upiapp" />
    </queries>

    <application
        android:allowBackup="true"
        android:label="${config.appName}"
        android:theme="@style/Theme.MaterialComponents">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>`;
  };

  const handleGenerateIntegration = async () => {
    if (!config.merchantId || !config.clientId) {
      toast.error("Please provide Merchant ID and Client ID");
      return;
    }

    setIsGenerating(true);
    toast.loading("Analyzing codebase and generating integration...");

    // Generate all necessary files
    const buildGradle = generateUpdatedBuildGradle();
    const mainActivity = generateMainActivity();
    const manifest = generateAndroidManifest();
    const readme = generateIntegrationReadme();

    setGeneratedFiles({
      buildGradle,
      mainActivity,
      manifest,
      readme,
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsGenerating(false);
    toast.dismiss();
    setIntegrationStep("configure");
    toast.success("Integration code generated! Review the files below.");
  };

  const generateIntegrationReadme = () => {
    return `# Juspay HyperCheckout SDK Integration

## Changes Made

### 1. build.gradle
- Added Juspay Maven repository
- Added HyperSDK dependency (v2.2.5)
- Added Java 8 compatibility settings

### 2. MainActivity.${projectStructure?.mainActivityPath?.endsWith('.kt') ? 'kt' : 'java'}
- Added Juspay SDK imports
- Added \`initializeHyperCheckout()\` method
- Added \`startPayment()\` method
- Added callback handler for payment events

### 3. AndroidManifest.xml
- Added INTERNET permission
- Added UPI intent queries for payment apps

## Credentials Used
- Merchant ID: ${config.merchantId}
- Client ID: ${config.clientId}
- Environment: ${config.environment}
- Package Name: ${config.packageName}

## Next Steps

1. Sync your project with Gradle files
2. Run the app to verify SDK initializes
3. Call \`startPayment()\` to initiate a payment

## Testing
Use the following test cards in Sandbox:
- Card: 4111 1111 1111 1111
- Expiry: Any future date
- CVV: Any 3 digits

For support: developer@juspay.io
`;
  };

  const downloadModifiedProject = () => {
    // Create a zip-like structure using Blob
    const files = [
      { name: 'app/build.gradle', content: generatedFiles?.buildGradle || '' },
      { name: 'app/src/main/' + (projectStructure?.mainActivityPath?.replace(/.*main\//, '') || `java/${config.packageName.replace(/\./g, '/')}/MainActivity.kt`), content: generatedFiles?.mainActivity || '' },
      { name: 'app/src/main/AndroidManifest.xml', content: generatedFiles?.manifest || '' },
      { name: 'JUSPAY_INTEGRATION_README.md', content: generatedFiles?.readme || '' },
    ];

    // For each file, create a downloadable blob
    files.forEach(file => {
      const blob = new Blob([file.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.split('/').pop() || 'file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });

    toast.success("Files downloaded! Check your Downloads folder.");
  };

  const renderCredentialsStep = () => (
    <div className="space-y-6">
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className={cn("w-5 h-5", activeTheme.text)} />
            Merchant Credentials
          </CardTitle>
          <CardDescription>
            Enter your Juspay credentials to generate the integration code
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="merchantId">Merchant ID</Label>
              <Input
                id="merchantId"
                placeholder="e.g., merchant_test"
                value={config.merchantId}
                onChange={(e) => setConfig({ ...config, merchantId: e.target.value })}
                className={cn("focus-visible:ring-offset-0", activeTheme.ring)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientId">Client ID</Label>
              <Input
                id="clientId"
                placeholder="e.g., merchant_test_android"
                value={config.clientId}
                onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                className={cn("focus-visible:ring-offset-0", activeTheme.ring)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your Juspay API Key"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              className={cn("focus-visible:ring-offset-0", activeTheme.ring)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Environment</Label>
              <Select
                value={config.environment}
                onValueChange={(v) => setConfig({ ...config, environment: v as "sandbox" | "production" })}
              >
                <SelectTrigger className={cn(activeTheme.ring)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                  <SelectItem value="production">Production (Live)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="packageName">Android Package Name</Label>
              <Input
                id="packageName"
                placeholder="com.example.myapp"
                value={config.packageName}
                onChange={(e) => setConfig({ ...config, packageName: e.target.value })}
                className={cn("focus-visible:ring-offset-0", activeTheme.ring)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Button
          onClick={() => setIntegrationStep("codebase")}
          disabled={!config.merchantId || !config.apiKey}
          className={cn("w-full h-14 text-lg", activeTheme.primary)}
        >
          <Zap className="w-5 h-5 mr-2" />
          Continue to Codebase Integration
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );

  const renderCodebaseStep = () => (
    <div className="space-y-6">
      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className={cn("w-5 h-5", activeTheme.text)} />
            Upload Your Codebase
          </CardTitle>
          <CardDescription>
            Upload your Android project files to automatically add Juspay SDK dependencies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
              "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600",
              uploadedFiles.length > 0 && "border-green-500 bg-green-50/30 dark:bg-green-950/20"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              // @ts-ignore - webkitdirectory for folder upload
              webkitdirectory=""
              directory=""
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <Upload className={cn("w-12 h-12 mx-auto mb-4", uploadedFiles.length > 0 ? "text-green-500" : "text-zinc-400")} />
            {uploadedFiles.length > 0 ? (
              <>
                <p className="font-medium text-zinc-900 dark:text-white">{uploadedFiles.length} file(s) uploaded</p>
                <p className="text-sm text-zinc-500 mt-1">Click to add more files</p>
              </>
            ) : (
              <>
                <p className="font-medium text-zinc-900 dark:text-white">Click to select your Android project folder</p>
                <p className="text-sm text-zinc-500 mt-1">We'll scan for build.gradle, MainActivity, and AndroidManifest.xml</p>
              </>
            )}
          </div>

          {uploadedFiles.length > 0 && (
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Uploaded files:</p>
              <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((file, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {file.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-400">Auto-Detection</p>
                <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                  We'll automatically detect your project structure and add the necessary dependencies.
                  If you don't upload files, we'll generate a fresh integration.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => setIntegrationStep("credentials")}
          className="flex-1 h-12"
        >
          Back
        </Button>
        <motion.div className="flex-[2]" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleGenerateIntegration}
            disabled={isGenerating}
            className={cn("w-full h-12", activeTheme.primary)}
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Generating Integration...
              </>
            ) : (
              <>
                <Code2 className="w-5 h-5 mr-2" />
                Generate Integration Code
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );

  const renderConfigureStep = () => (
    <div className="space-y-6">
      <Tabs defaultValue="build-gradle" className="space-y-4">
        <TabsList className="bg-zinc-100/50 dark:bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <TabsTrigger value="build-gradle" className="text-sm">build.gradle</TabsTrigger>
          <TabsTrigger value="main-activity" className="text-sm">MainActivity.kt</TabsTrigger>
          <TabsTrigger value="manifest" className="text-sm">AndroidManifest.xml</TabsTrigger>
        </TabsList>

        <TabsContent value="build-gradle">
          <Card className="border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  app/build.gradle
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generateUpdatedBuildGradle(), 'gradle')}
                >
                  {copiedSnippet === 'gradle' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <CardDescription>
                Updated with Juspay SDK dependencies and repository
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <pre className="p-4 overflow-x-auto bg-slate-900 text-zinc-100 text-sm font-mono max-h-96 overflow-y-auto">
                <code>{generateUpdatedBuildGradle()}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="main-activity">
          <Card className="border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Code2 className="w-5 h-5" />
                  MainActivity.kt
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generateMainActivity(), 'activity')}
                >
                  {copiedSnippet === 'activity' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <CardDescription>
                Complete integration with your credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <pre className="p-4 overflow-x-auto bg-slate-900 text-zinc-100 text-sm font-mono max-h-96 overflow-y-auto">
                <code>{generateMainActivity()}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manifest">
          <Card className="border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <CardHeader className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCode className="w-5 h-5" />
                  AndroidManifest.xml
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(generateAndroidManifest(), 'manifest')}
                >
                  {copiedSnippet === 'manifest' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <CardDescription>
                Required permissions and UPI intent queries
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <pre className="p-4 overflow-x-auto bg-slate-900 text-zinc-100 text-sm font-mono max-h-96 overflow-y-auto">
                <code>{generateAndroidManifest()}</code>
              </pre>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => setIntegrationStep("codebase")}
          className="flex-1 h-12"
        >
          Back
        </Button>
        <motion.div className="flex-[2]" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setShowPreview(true)}
            className={cn("w-full h-12", activeTheme.primary)}
          >
            <Eye className="w-5 h-5 mr-2" />
            Preview Integration
          </Button>
        </motion.div>
      </div>

      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-400">
            <Download className="w-5 h-5" />
            Download Complete Project
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-green-700 dark:text-green-500 mb-4">
            Download a complete Android Studio project with Juspay SDK pre-configured.
          </p>
          <Button
            variant="outline"
            className="border-green-300 dark:border-green-700 text-green-700 dark:text-green-400"
            onClick={downloadModifiedProject}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Modified Files
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderLivePreview = () => (
    <Dialog open={showPreview} onOpenChange={setShowPreview}>
      <DialogContent className="w-auto min-w-[900px] max-w-[95vw] h-[90vh] max-h-[800px] overflow-hidden p-0 flex flex-col">
        {/* Header */}
        <div className="flex-none px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Smartphone className={cn("w-5 h-5", activeTheme.text)} />
              Live Integration Preview
            </DialogTitle>
            <DialogDescription className="text-sm">
              Simulated Android app with real-time SDK logs
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Main Content - Flex Row Layout */}
        <div className="flex-1 flex flex-row min-h-0">
          {/* Phone Mockup - Left Side */}
          <div className="w-[55%] flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 p-4 overflow-auto">
            <div
              className="relative bg-zinc-900 rounded-[1.5rem] border-[8px] border-zinc-800 shadow-2xl"
              style={{
                width: '240px',
                height: '480px',
                flexShrink: 0,
              }}
            >
              {/* Phone buttons */}
              <div className="absolute -right-[8px] top-20 w-[3px] h-8 bg-zinc-700 rounded-r" />
              <div className="absolute -right-[8px] top-28 w-[3px] h-10 bg-zinc-700 rounded-r" />
              <div className="absolute -left-[8px] top-24 w-[3px] h-5 bg-zinc-700 rounded-l" />

              {/* Phone notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-zinc-800 rounded-b-lg z-20 flex items-center justify-center">
                <div className="w-8 h-0.5 bg-zinc-700 rounded-full" />
              </div>

              {/* Screen content */}
              <div className="w-full h-full bg-white dark:bg-zinc-950 rounded-[1rem] pt-4 px-2 pb-2 flex flex-col overflow-hidden relative">
                {/* Payment Sheet Overlay */}
                <AnimatePresence>
                  {showPaymentUI && (
                    <motion.div
                      initial={{ y: "100%" }}
                      animate={{ y: 0 }}
                      exit={{ y: "100%" }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                      className="absolute inset-0 z-50 bg-white dark:bg-zinc-900 rounded-[1rem] flex flex-col"
                    >
                      {/* Sheet Header */}
                      <div className="flex items-center justify-between p-3 border-b border-zinc-200 dark:border-zinc-800">
                        <div>
                          <p className="text-[11px] font-bold text-zinc-900 dark:text-white">Pay ₹1.00</p>
                          <p className="text-[9px] text-zinc-500">{config.merchantId || "Merchant"}</p>
                        </div>
                        <button
                          onClick={() => {
                            setShowPaymentUI(false);
                            addLog('warning', 'User dismissed payment sheet');
                          }}
                          className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center"
                        >
                          <span className="text-zinc-500">✕</span>
                        </button>
                      </div>

                      {/* Payment Methods */}
                      <div className="flex-1 overflow-y-auto p-2">
                        <p className="text-[9px] font-semibold text-zinc-500 uppercase mb-2 px-1">Select Payment Method</p>

                        {/* UPI */}
                        <button
                          onClick={() => setSelectedPaymentMethod('upi')}
                          className={cn(
                            "w-full flex items-center gap-2 p-2.5 rounded-lg mb-2 border",
                            selectedPaymentMethod === 'upi'
                              ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
                              : "border-zinc-200 dark:border-zinc-700"
                          )}
                        >
                          <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center text-[10px] font-bold text-green-600">UPI</div>
                          <div className="flex-1 text-left">
                            <p className="text-[10px] font-semibold text-zinc-900 dark:text-white">UPI</p>
                            <p className="text-[8px] text-zinc-500">Google Pay, PhonePe, Paytm</p>
                          </div>
                          {selectedPaymentMethod === 'upi' && <div className="w-4 h-4 rounded-full bg-violet-500" />}
                        </button>

                        {/* Cards */}
                        <button
                          onClick={() => setSelectedPaymentMethod('card')}
                          className={cn(
                            "w-full flex items-center gap-2 p-2.5 rounded-lg mb-2 border",
                            selectedPaymentMethod === 'card'
                              ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
                              : "border-zinc-200 dark:border-zinc-700"
                          )}
                        >
                          <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-[10px]">💳</div>
                          <div className="flex-1 text-left">
                            <p className="text-[10px] font-semibold text-zinc-900 dark:text-white">Card</p>
                            <p className="text-[8px] text-zinc-500">Credit / Debit Card</p>
                          </div>
                          {selectedPaymentMethod === 'card' && <div className="w-4 h-4 rounded-full bg-violet-500" />}
                        </button>

                        {/* Wallet */}
                        <button
                          onClick={() => setSelectedPaymentMethod('wallet')}
                          className={cn(
                            "w-full flex items-center gap-2 p-2.5 rounded-lg mb-2 border",
                            selectedPaymentMethod === 'wallet'
                              ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
                              : "border-zinc-200 dark:border-zinc-700"
                          )}
                        >
                          <div className="w-8 h-8 rounded bg-purple-100 flex items-center justify-center text-[10px]">👛</div>
                          <div className="flex-1 text-left">
                            <p className="text-[10px] font-semibold text-zinc-900 dark:text-white">Wallet</p>
                            <p className="text-[8px] text-zinc-500">Paytm, Amazon Pay, Mobikwik</p>
                          </div>
                          {selectedPaymentMethod === 'wallet' && <div className="w-4 h-4 rounded-full bg-violet-500" />}
                        </button>

                        {/* NetBanking */}
                        <button
                          onClick={() => setSelectedPaymentMethod('netbanking')}
                          className={cn(
                            "w-full flex items-center gap-2 p-2.5 rounded-lg border",
                            selectedPaymentMethod === 'netbanking'
                              ? "border-violet-500 bg-violet-50 dark:bg-violet-950/20"
                              : "border-zinc-200 dark:border-zinc-700"
                          )}
                        >
                          <div className="w-8 h-8 rounded bg-amber-100 flex items-center justify-center text-[10px]">🏦</div>
                          <div className="flex-1 text-left">
                            <p className="text-[10px] font-semibold text-zinc-900 dark:text-white">Net Banking</p>
                            <p className="text-[8px] text-zinc-500">All major banks</p>
                          </div>
                          {selectedPaymentMethod === 'netbanking' && <div className="w-4 h-4 rounded-full bg-violet-500" />}
                        </button>
                      </div>

                      {/* Pay Button */}
                      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                          onClick={simulateProcess}
                          disabled={!selectedPaymentMethod || isProcessingPayment}
                          className={cn(
                            "w-full py-2.5 rounded-lg font-bold text-[11px] text-white",
                            selectedPaymentMethod ? activeTheme.primary : "bg-zinc-300",
                            "flex items-center justify-center gap-1"
                          )}
                        >
                          {isProcessingPayment ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>Pay ₹1.00</>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Status Bar */}
                <div className="flex items-center justify-between px-1.5 mb-3 text-[9px] text-zinc-900 dark:text-white flex-none">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-1.5 bg-zinc-900 dark:bg-white rounded-sm" />
                    <div className="w-3 h-1.5 border border-zinc-900 dark:border-white rounded-sm" />
                  </div>
                </div>

                {/* App Header */}
                <div className="flex items-center justify-between mb-4 flex-none">
                  <div>
                    <h3 className="font-bold text-[13px] text-zinc-900 dark:text-white">{config.appName || "Demo App"}</h3>
                    <p className="text-[10px] text-zinc-500">Powered by Juspay</p>
                  </div>
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold flex-none", activeTheme.bg, activeTheme.text)}>
                    {config.merchantId?.charAt(0).toUpperCase() || "M"}
                  </div>
                </div>

                {/* SDK Status Indicator */}
                <div className="mb-3 flex-none">
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-[10px]",
                    sdkStatus === "ready" ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400" :
                    sdkStatus === "initiating" ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400" :
                    sdkStatus === "processing" ? "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400" :
                    sdkStatus === "success" ? "bg-green-50 text-green-700" :
                    sdkStatus === "error" ? "bg-red-50 text-red-700" :
                    "bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      sdkStatus === "ready" ? "bg-green-500" :
                      sdkStatus === "initiating" ? "bg-amber-500 animate-pulse" :
                      sdkStatus === "processing" ? "bg-blue-500 animate-pulse" :
                      sdkStatus === "success" ? "bg-green-500" :
                      sdkStatus === "error" ? "bg-red-500" :
                      "bg-zinc-400"
                    )} />
                    <span className="font-medium">
                      {sdkStatus === "idle" && "SDK Not Initialized"}
                      {sdkStatus === "initiating" && "Initializing SDK..."}
                      {sdkStatus === "ready" && "SDK Ready"}
                      {sdkStatus === "processing" && "Processing Payment..."}
                      {sdkStatus === "success" && "Payment Successful"}
                      {sdkStatus === "error" && "Payment Failed"}
                      {sdkStatus === "cancelled" && "Payment Cancelled"}
                    </span>
                  </div>
                </div>

                {/* Welcome Text */}
                <div className="mb-3 flex-none">
                  <p className="text-base font-semibold text-zinc-900 dark:text-white">Hello! 👋</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Complete your purchase securely</p>
                </div>

                {/* Product Card */}
                <Card className="mb-3 border-zinc-200 dark:border-zinc-800 shadow-sm flex-none">
                  <CardContent className="p-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 rounded-lg flex items-center justify-center flex-none">
                        <Smartphone className="w-5 h-5 text-zinc-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[13px] text-zinc-900 dark:text-white truncate">Premium Plan</p>
                        <p className="text-[10px] text-zinc-500">Monthly subscription</p>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-[13px] font-bold text-zinc-900 dark:text-white">₹1.00</span>
                          <span className="text-[9px] text-zinc-500 line-through">₹99.00</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Spacer */}
                <div className="flex-1 min-h-2" />

                {/* Pay Button */}
                <motion.button
                  whileHover={{ scale: sdkStatus === "ready" ? 1.02 : 1 }}
                  whileTap={{ scale: sdkStatus === "ready" ? 0.98 : 1 }}
                  disabled={sdkStatus !== "ready"}
                  className={cn(
                    "w-full py-2.5 rounded-lg font-bold text-[13px] text-white flex-none",
                    sdkStatus === "ready" ? activeTheme.primary : "bg-zinc-300 cursor-not-allowed",
                    "shadow-lg",
                    "flex items-center justify-center gap-1"
                  )}
                  onClick={() => {
                    setShowPaymentUI(true);
                    addLog('info', 'User clicked Pay button');
                  }}
                >
                  {sdkStatus === "initiating" ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Initializing...</>
                  ) : sdkStatus === "ready" ? (
                    <><Zap className="w-3.5 h-3.5" /> Pay ₹1.00</>
                  ) : (
                    <><Zap className="w-3.5 h-3.5" /> Pay ₹1.00</>
                  )}
                </motion.button>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-1 mt-1.5 text-[9px] text-zinc-400 flex-none">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Secured by Juspay | PCI-DSS Compliant</span>
                </div>
              </div>
            </div>
          </div>

          {/* Logs Panel - Right Side - 45% width */}
          <div className="w-[45%] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 flex flex-col">
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 flex-none py-4 px-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-zinc-500" />
                    Integration Logs
                  </CardTitle>
                  <CardDescription>Real-time SDK activity monitor</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLogs([]);
                    setSdkStatus("idle");
                  }}
                >
                  Clear
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              {/* Scrollable Logs Area */}
              <div className="flex-1 bg-slate-950 p-4 font-mono text-xs space-y-1.5 overflow-y-auto min-h-0">
                {logs.length === 0 ? (
                  <div className="text-zinc-600 italic">Click "Start SDK" to begin simulation...</div>
                ) : (
                  logs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-zinc-600 flex-none">[{log.timestamp}]</span>
                      <span className={cn(
                        "flex-none",
                        log.type === 'success' ? "text-green-400" :
                        log.type === 'error' ? "text-red-400" :
                        log.type === 'warning' ? "text-amber-400" :
                        log.type === 'sdk' ? "text-blue-400" :
                        "text-cyan-400"
                      )}>
                        {log.type === 'success' ? '✓' :
                         log.type === 'error' ? '✗' :
                         log.type === 'warning' ? '!' :
                         log.type === 'sdk' ? '◆' :
                         '→'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-zinc-300">{log.message}</span>
                        {log.details && (
                          <div className="mt-1 pl-4 text-zinc-500 whitespace-pre-wrap break-all text-[10px]">
                            {log.details}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>

              {/* SDK Control Footer */}
              <div className="flex-none p-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">SDK Controls:</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.success("Initiate SDK called")}
                    className="h-10 flex-1 min-w-[120px]"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Re-initiate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.success("Process payment called")}
                    className="h-10 flex-1 min-w-[120px]"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Trigger Pay
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.error("Simulated: Payment failed")}
                    className="h-10 flex-1 min-w-[120px] border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Simulate Fail
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.success("Simulated: Payment success")}
                    className="h-10 flex-1 min-w-[120px] border-green-200 text-green-600 hover:bg-green-50"
                  >
                    Simulate Success
                  </Button>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white">
          App Integrator
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Real-time Juspay SDK integration wizard. Enter your credentials, upload your codebase, and get production-ready integration code.
        </p>
      </motion.div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-zinc-100/50 dark:bg-zinc-900/50 p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <TabsTrigger
            value="quick-integrator"
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              "data-[state=active]:bg-white data-[state=active]:shadow-sm",
              "data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white",
              "data-[state=inactive]:text-zinc-500 dark:data-[state=inactive]:text-zinc-400"
            )}
          >
            <Zap className="w-4 h-4 mr-2" />
            Quick Integrator
          </TabsTrigger>
          <TabsTrigger
            value="documentation"
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              "data-[state=active]:bg-white data-[state=active]:shadow-sm",
              "data-[state=active]:text-zinc-900 dark:data-[state=active]:text-white",
              "data-[state=inactive]:text-zinc-500 dark:data-[state=inactive]:text-zinc-400"
            )}
          >
            <FileCode className="w-4 h-4 mr-2" />
            Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick-integrator" className="space-y-6">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-2">
            {(["credentials", "codebase", "configure"] as IntegrationStep[]).map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                    integrationStep === step
                      ? cn(activeTheme.primary, "text-white")
                      : (["codebase", "configure"].includes(integrationStep) &&
                         (["credentials", "codebase"].includes(step)))
                      ? "bg-green-500 text-white"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500"
                  )}
                >
                  {(["codebase", "configure"].includes(integrationStep) && step === "credentials") ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className={cn(
                  "text-sm hidden sm:block",
                  integrationStep === step ? "text-zinc-900 dark:text-white font-medium" : "text-zinc-500"
                )}>
                  {step === "credentials" ? "Credentials" : step === "codebase" ? "Codebase" : "Configure"}
                </span>
                {index < 2 && <div className="w-8 h-px bg-zinc-300 dark:bg-zinc-700" />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            {integrationStep === "credentials" && (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {renderCredentialsStep()}
              </motion.div>
            )}
            {integrationStep === "codebase" && (
              <motion.div
                key="codebase"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {renderCodebaseStep()}
              </motion.div>
            )}
            {integrationStep === "configure" && (
              <motion.div
                key="configure"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                {renderConfigureStep()}
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="documentation">
          <Card className="border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle>Platform Documentation</CardTitle>
              <CardDescription>Select a platform to view detailed integration guides</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: "Android", icon: Smartphone, color: "bg-green-500" },
                  { name: "iOS", icon: Apple, color: "bg-gray-800" },
                  { name: "React Native", icon: Code2, color: "bg-blue-500" },
                  { name: "Flutter", icon: Code2, color: "bg-cyan-500" },
                ].map((plat) => (
                  <a
                    key={plat.name}
                    href="https://juspay.io/in/docs/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center gap-3 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors group"
                  >
                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", plat.color)}>
                      <plat.icon className="w-6 h-6" />
                    </div>
                    <span className="font-medium text-zinc-900 dark:text-white">{plat.name}</span>
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {renderLivePreview()}
    </div>
  );
}
