import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';
import { LeadPayload, VideoConfig, VideoKey } from '../../models/lead.models';
import { LeadApiService } from '../../services/lead-api.service';

const SERVICE_OPTIONS = ['Provident Fund', 'Payroll Management', 'HRMS'] as const;
const COMPANY_SIZES = ['1–10', '11–50', '51–200', '201–500', '501–1000', '1000+'] as const;
const COUNTER_TARGET = 247;

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './landing.component.html',
})
export class LandingComponent implements AfterViewInit, OnDestroy {
  private readonly leadApi = inject(LeadApiService);
  private readonly sanitizer = inject(DomSanitizer);
  private counterObserver?: IntersectionObserver;

  @ViewChild('counterEl') counterEl?: ElementRef<HTMLElement>;

  readonly serviceOptions = SERVICE_OPTIONS;
  readonly companySizes = COMPANY_SIZES;
  readonly videos = environment.videos;

  navScrolled = signal(false);
  counterValue = signal(0);

  activeVideo = signal<VideoKey>('overview');
  inlinePlaying = signal(false);
  lightboxOpen = signal(false);

  name = '';
  company = '';
  size = '';
  phone = '';
  email = '';
  details = '';
  selectedServices = signal<Set<string>>(new Set());

  invalid = {
    name: false,
    company: false,
    size: false,
    phone: false,
    email: false,
    services: false,
  };

  submitting = signal(false);
  submitLabel = signal('Send my requirements');
  showSuccess = signal(false);
  successMessage = signal(
    'Thanks — a ReCom specialist will reach out within one business day to map out your requirements.',
  );

  activeVideoConfig = computed<VideoConfig>(() => this.videos[this.activeVideo()]);

  lightboxWide = computed(() => {
    const v = this.activeVideoConfig();
    const url = v.url.trim();
    return !this.isFacebook(url) && !v.portrait;
  });

  lightboxMediaUrl = signal<string | null>(null);
  lightboxSafeUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.lightboxMediaUrl();
    if (!url || !this.isFacebook(url)) return null;
    const embed =
      'https://www.facebook.com/plugins/video.php?href=' +
      encodeURIComponent(url) +
      '&show_text=false&width=360&height=640&autoplay=true';
    return this.sanitizer.bypassSecurityTrustResourceUrl(embed);
  });

  inlineIframeSrc = computed<SafeResourceUrl | null>(() => {
    const url = this.activeVideoConfig().url.trim();
    if (!url || this.isFile(url)) return null;
    let src = url;
    if (/youtube\.com|youtu\.be/.test(src)) {
      src += (src.includes('?') ? '&' : '?') + 'autoplay=1';
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(src);
  });

  ngAfterViewInit(): void {
    this.setupCounter();
  }

  ngOnDestroy(): void {
    this.counterObserver?.disconnect();
    document.body.style.overflow = '';
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.navScrolled.set(window.scrollY > 8);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.lightboxOpen()) this.closeVideo();
  }

  selectVideo(key: VideoKey): void {
    this.activeVideo.set(key);
    this.inlinePlaying.set(false);
  }

  playVideo(): void {
    const v = this.activeVideoConfig();
    const url = v.url.trim();
    if (!url) return;

    if (this.isFacebook(url) || v.portrait) {
      this.lightboxMediaUrl.set(url);
      this.lightboxOpen.set(true);
      document.body.style.overflow = 'hidden';
      return;
    }

    this.inlinePlaying.set(true);
  }

  closeVideo(): void {
    this.lightboxOpen.set(false);
    this.lightboxMediaUrl.set(null);
    document.body.style.overflow = '';
  }

  isServiceSelected(service: string): boolean {
    return this.selectedServices().has(service);
  }

  toggleService(service: string): void {
    const next = new Set(this.selectedServices());
    if (next.has(service)) next.delete(service);
    else next.add(service);
    this.selectedServices.set(next);
    this.invalid.services = false;
  }

  onServiceKeydown(event: KeyboardEvent, service: string): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.toggleService(service);
    }
  }

  clearFieldError(field: 'name' | 'company' | 'size' | 'phone' | 'email'): void {
    this.invalid[field] = false;
  }

  onSubmit(): void {
    if (!this.validate()) {
      return;
    }

    const payload: LeadPayload = {
      name: this.name.trim(),
      company: this.company.trim(),
      companySize: this.size,
      phone: this.phone.trim(),
      email: this.email.trim(),
      services: [...this.selectedServices()],
      details: this.details.trim(),
      submittedAt: new Date().toISOString(),
    };

    this.submitting.set(true);
    this.submitLabel.set('Sending…');

    this.leadApi.submitLead(payload).subscribe({
      next: () => this.showSuccessState(payload),
      error: () => {
        this.submitting.set(false);
        this.submitLabel.set('Try again');
        alert('Something went wrong sending your details. Please try again, or call us directly.');
      },
    });
  }

  resetForm(): void {
    this.name = '';
    this.company = '';
    this.size = '';
    this.phone = '';
    this.email = '';
    this.details = '';
    this.selectedServices.set(new Set());
    this.invalid = { name: false, company: false, size: false, phone: false, email: false, services: false };
    this.submitting.set(false);
    this.submitLabel.set('Send my requirements');
    this.showSuccess.set(false);
  }

  isFile(url: string): boolean {
    return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i.test(url);
  }

  isFacebook(url: string): boolean {
    return /facebook\.com/.test(url);
  }

  private validate(): boolean {
    const phoneOk = /^[+]?[\d\s().-]{7,}$/.test(this.phone.trim());
    const emailOk = this.email.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
    const servicesOk = this.selectedServices().size > 0;

    this.invalid.name = !this.name.trim();
    this.invalid.company = !this.company.trim();
    this.invalid.size = !this.size;
    this.invalid.phone = !phoneOk;
    this.invalid.email = !emailOk;
    this.invalid.services = !servicesOk;

    return (
      !this.invalid.name &&
      !this.invalid.company &&
      !this.invalid.size &&
      !this.invalid.phone &&
      !this.invalid.email &&
      servicesOk
    );
  }

  private showSuccessState(payload: LeadPayload): void {
    const firstName = payload.name.split(' ')[0];
    this.successMessage.set(
      `Thanks, ${firstName} — a ReCom specialist will reach out within one business day to map out ${payload.company}'s requirements.`,
    );
    this.showSuccess.set(true);
  }

  private setupCounter(): void {
    const el = this.counterEl?.nativeElement;
    if (!el) return;

    this.counterObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (reduce) {
            this.counterValue.set(COUNTER_TARGET);
            this.counterObserver?.disconnect();
            return;
          }
          let n = 0;
          const step = Math.max(1, Math.round(COUNTER_TARGET / 45));
          const timer = window.setInterval(() => {
            n += step;
            if (n >= COUNTER_TARGET) {
              n = COUNTER_TARGET;
              window.clearInterval(timer);
            }
            this.counterValue.set(n);
          }, 28);
          this.counterObserver?.disconnect();
        });
      },
      { threshold: 0.5 },
    );
    this.counterObserver.observe(el);
  }
}
